import express from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

router.post('/', [
  body('email').isEmail().normalizeEmail(),
  body('name').optional().trim().escape(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { email, name } = req.body;

    const subscriber = await prisma.subscriber.upsert({
      where: { email },
      update: { isActive: true, name: name || undefined },
      create: { email, name, source: 'website' },
    });

    res.status(201).json({
      success: true,
      message: 'Welcome to the Ham-Head AI journey!',
      id: subscriber.id
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ error: 'Subscription failed' });
  }
});

export default router;
