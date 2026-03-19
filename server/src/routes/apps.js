import express from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// GET /api/apps
router.get('/', async (req, res) => {
  try {
    const { category, status, page = 1, limit = 12 } = req.query;

    const where = {};
    if (category && category !== 'ALL') where.category = category;
    if (status) where.status = status;

    const [apps, total] = await Promise.all([
      prisma.application.findMany({
        where,
        orderBy: { day: 'asc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.application.count({ where })
    ]);

    res.json({
      apps,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Apps fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// GET /api/apps/:id
router.get('/:id', async (req, res) => {
  try {
    const app = await prisma.application.findUnique({
      where: { id: req.params.id },
    });
    if (!app) return res.status(404).json({ error: 'Not found' });
    res.json(app);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
