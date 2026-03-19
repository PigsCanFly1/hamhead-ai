import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.campaign.upsert({
    where: { id: 'current' },
    update: {},
    create: {
      id: 'current',
      title: '100 Days - 100 Apps Campaign',
      description: 'Ham-Head AI commits to releasing 100 AI-powered applications in 100 days.',
      currentDay: 23,
      appsReleased: 23,
    },
  });

  const apps = [
    {
      name: "EthiCalc",
      description: "Native Ethical Intelligence calculator for transparent AI decision-making auditing. Developed in the Ham-Head AI S.O.L.E. Environment.",
      day: 23,
      category: "ECONOMIC",
      status: "RELEASED",
      tags: ["ethics", "finance", "transparency"],
      releaseDate: new Date(),
    },
    {
      name: "AgriMind Local",
      description: "Agentic intelligence for sustainable Midwest agriculture optimization.",
      day: 24,
      category: "ECONOMIC",
      status: "DEVELOPMENT",
      tags: ["agriculture", "sustainability", "midwest"],
    },
    {
      name: "SoulSync",
      description: "Agentic meditation companion for deep consciousness work.",
      day: 3,
      category: "SPIRITUAL",
      status: "RELEASED",
      tags: ["meditation", "consciousness", "wellness"],
      releaseDate: new Date('2024-02-18'),
    },
    {
      name: "CommuneAI",
      description: "Decentralized community intelligence platform for authentic social connection.",
      day: 5,
      category: "SOCIAL",
      status: "RELEASED",
      tags: ["community", "decentralized", "social"],
      releaseDate: new Date('2024-02-20'),
    },
    {
      name: "ProfitPath",
      description: "Ethical income optimization for creators balancing growth with wellbeing.",
      day: 7,
      category: "ECONOMIC",
      status: "RELEASED",
      tags: ["career", "finance", "creators"],
      releaseDate: new Date('2024-02-22'),
    },
    {
      name: "MindMap Midwest",
      description: "Neural mapping tool for autodidactic learners to visualize knowledge graphs.",
      day: 10,
      category: "PERSONAL",
      status: "RELEASED",
      tags: ["learning", "knowledge", "visualization"],
      releaseDate: new Date('2024-02-25'),
    },
    {
      name: "RootCause AI",
      description: "Agentic root cause analysis for personal and professional problem solving.",
      day: 12,
      category: "PERSONAL",
      status: "RELEASED",
      tags: ["analysis", "productivity", "problem-solving"],
      releaseDate: new Date('2024-02-27'),
    },
    {
      name: "ChurchOS",
      description: "Community management platform for faith-based organizations with AI-assisted pastoral care.",
      day: 15,
      category: "SPIRITUAL",
      status: "BETA",
      tags: ["faith", "community", "management"],
    },
    {
      name: "SkillStack",
      description: "AI-powered skill gap analyzer that maps your talents to market opportunities.",
      day: 18,
      category: "ECONOMIC",
      status: "RELEASED",
      tags: ["skills", "career", "ai"],
      releaseDate: new Date('2024-03-04'),
    },
    {
      name: "NeighborNet",
      description: "Hyperlocal social intelligence platform for Midwest community building.",
      day: 20,
      category: "SOCIAL",
      status: "BETA",
      tags: ["local", "community", "social"],
    },
    {
      name: "DeepRead",
      description: "AI companion for deep reading and Socratic dialogue with any text.",
      day: 22,
      category: "PERSONAL",
      status: "RELEASED",
      tags: ["reading", "learning", "socratic"],
      releaseDate: new Date('2024-03-08'),
    },
    {
      name: "CodeSage",
      description: "Technical mentor AI trained on pragmatic Midwest problem-solving patterns.",
      day: 25,
      category: "TECHNICAL",
      status: "DEVELOPMENT",
      tags: ["coding", "mentorship", "technical"],
    },
  ];

  for (const app of apps) {
    await prisma.application.upsert({
      where: { day: app.day },
      update: {},
      create: app,
    });
  }

  console.log('✅ Ham-Head AI Database Seeded');
  console.log('📊 Campaign: Day 23/100, 23 Apps Released');
  console.log(`📱 ${apps.length} Applications seeded`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
