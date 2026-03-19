import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: 'current' },
    });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    const now = new Date();
    const start = new Date(campaign.startDate);
    const daysElapsed = Math.floor((now - start) / (1000 * 60 * 60 * 24));

    res.json({
      ...campaign,
      stats: {
        daysElapsed: Math.min(daysElapsed, campaign.totalDays),
        daysRemaining: Math.max(campaign.totalDays - daysElapsed, 0),
        progress: (campaign.appsReleased / campaign.totalDays) * 100,
        currentStreak: campaign.appsReleased,
      }
    });
  } catch (error) {
    console.error('Campaign fetch error:', error);
    res.status(500).json({ error: 'Failed to load campaign' });
  }
});

export default router;
