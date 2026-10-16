import express from 'express';
import rateLimit from 'express-rate-limit';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

// AI helper for the Stub paystub app (client/public/apps/stub).
// Payroll data lives in the visitor's browser; only the names, pay types and
// rates needed to answer a single request are sent here, and nothing is stored.

const router = express.Router();
const MODEL = 'claude-opus-5-5';
let client;
// Created lazily so a key loaded by dotenv in index.js (after imports run) is seen.
const getClient = () => {
  if (client === undefined) client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;
  return client;
};

router.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many AI requests. Try again in a few minutes.' },
}));

const Employee = z.object({
  id: z.string().max(40),
  name: z.string().max(120),
  type: z.enum(['hourly', 'salary', 'contractor']),
  rate: z.number().nonnegative().max(10_000_000),
  usualHours: z.number().nonnegative().max(1000).optional(),
});

const PlanReq = z.object({
  text: z.string().trim().min(1).max(2000),
  employees: z.array(Employee).max(200),
  today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  freq: z.enum(['weekly', 'biweekly', 'semimonthly', 'monthly']),
  defaultHours: z.number().nonnegative().max(1000),
  period: z.object({ periodStart: z.string(), periodEnd: z.string(), payDate: z.string() }),
});

const ReviewReq = z.object({
  stub: z.object({
    empName: z.string().max(120),
    empType: z.string().max(20),
    periodStart: z.string(), periodEnd: z.string(), payDate: z.string(),
    hours: z.number(), overtimeHours: z.number(), bonus: z.number(),
    gross: z.number(), totalTaxes: z.number(), totalDed: z.number(), net: z.number(),
    earnings: z.array(z.object({ label: z.string(), amount: z.number() }).passthrough()).max(20),
    taxes: z.array(z.object({ label: z.string(), amount: z.number() }).passthrough()).max(20),
    deductions: z.array(z.object({ label: z.string(), amount: z.number() }).passthrough()).max(20),
  }),
  previous: z.object({ gross: z.number(), net: z.number(), hours: z.number() }).nullable().optional(),
});

const PLAN_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string', description: 'One short sentence describing the payroll run.' },
    periodStart: { type: 'string', description: 'YYYY-MM-DD, or empty to keep the suggested period.' },
    periodEnd: { type: 'string', description: 'YYYY-MM-DD, or empty to keep the suggested period.' },
    payDate: { type: 'string', description: 'YYYY-MM-DD, or empty to keep the suggested pay date.' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          empId: { type: 'string' },
          hours: { type: 'number' },
          overtimeHours: { type: 'number' },
          bonus: { type: 'number' },
          note: { type: 'string' },
        },
        required: ['empId', 'hours', 'overtimeHours', 'bonus', 'note'],
        additionalProperties: false,
      },
    },
    unmatched: {
      type: 'array',
      items: { type: 'string' },
      description: 'Names or requests that could not be matched to an employee.',
    },
  },
  required: ['summary', 'periodStart', 'periodEnd', 'payDate', 'items', 'unmatched'],
  additionalProperties: false,
};

const REVIEW_SCHEMA = {
  type: 'object',
  properties: {
    ok: { type: 'boolean', description: 'True when nothing looks unusual.' },
    notes: { type: 'array', items: { type: 'string' }, description: 'Up to 4 short, specific observations.' },
  },
  required: ['ok', 'notes'],
  additionalProperties: false,
};

const PLAN_SYSTEM = `You turn a small-business owner's plain-English payroll request into a structured payroll run.
Rules:
- Only use employee ids from the provided roster. Match names loosely (first names, nicknames, typos).
- "Everyone" / "the usual" / "regular payroll" means every employee on the roster.
- When hours aren't stated, use each person's usualHours from the roster (for anyone without usualHours, hourly employees get the default hours). Salary employees: hours 0 (salary is fixed).
- Overtime is only what the user says is overtime. Bonuses are dollar amounts.
- Leave periodStart/periodEnd/payDate empty unless the user asks for specific dates; resolve relative dates against today.
- Put anything you could not match in "unmatched". Never invent employees.`;

const REVIEW_SYSTEM = `You double-check a single paystub draft for a small business before it is saved.
Point out only concrete, likely problems: hours that look off for the pay frequency, a big change from the previous stub, net pay that is negative or tiny, missing tax lines for a W-2 employee, pay date before the period ends, and similar. Keep each note under 20 words. If nothing looks unusual, return ok=true and an empty or one-line notes list. Taxes shown are flat-rate estimates; do not lecture about that.`;

async function ask(system, user, schema) {
  const response = await getClient().beta.messages.create({
    model: MODEL,
    max_tokens: 4000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low', format: { type: 'json_schema', schema } },
    system,
    messages: [{ role: 'user', content: user }],
  });
  if (response.stop_reason === 'refusal') {
    const err = new Error('The assistant declined this request.');
    err.status = 422;
    throw err;
  }
  const text = response.content.find((b) => b.type === 'text')?.text;
  if (!text) throw new Error('Empty response');
  return JSON.parse(text);
}

function handle(fn) {
  return async (req, res) => {
    if (!getClient()) return res.status(503).json({ error: 'AI is not configured on this server.' });
    try {
      res.json(await fn(req.body));
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid request' });
      if (error instanceof Anthropic.RateLimitError) return res.status(429).json({ error: 'AI is busy, try again shortly.' });
      if (error instanceof Anthropic.APIError) {
        console.error('Stub AI API error:', error.status, error.message);
        return res.status(502).json({ error: 'AI request failed.' });
      }
      console.error('Stub AI error:', error.message);
      res.status(error.status || 500).json({ error: error.status ? error.message : 'AI request failed.' });
    }
  };
}

router.get('/status', (req, res) => {
  res.json({ ai: Boolean(getClient()) });
});

router.post('/plan', express.json({ limit: '64kb' }), handle(async (body) => {
  const b = PlanReq.parse(body);
  const out = await ask(PLAN_SYSTEM, JSON.stringify({
    request: b.text,
    today: b.today,
    payFrequency: b.freq,
    defaultHours: b.defaultHours,
    suggestedPeriod: b.period,
    roster: b.employees,
  }), PLAN_SCHEMA);
  const ids = new Set(b.employees.map((e) => e.id));
  out.items = (out.items || []).filter((i) => ids.has(i.empId));
  return out;
}));

router.post('/review', express.json({ limit: '64kb' }), handle(async (body) => {
  const b = ReviewReq.parse(body);
  return ask(REVIEW_SYSTEM, JSON.stringify(b), REVIEW_SCHEMA);
}));

export default router;
