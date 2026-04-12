import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  const hashedPassword = await bcrypt.hash("dev-seed-password-change-me", 10);

  const user = await prisma.user.upsert({
    where: { email: "dev@flowforge.com" },
    update: {},
    create: {
      email: "dev@flowforge.com",
      password: hashedPassword,
    },
  });

  const workflowDefinition = {
    triggerId: "trigger-1",
    nodes: [
      {
        id: "trigger-1",
        type: "TRIGGER",
        data: { type: "webhook" },
        nextStepId: "ai-step-1",
      },
      {
        id: "ai-step-1",
        type: "AI",
        data: { model: "gpt-3.5", prompt: "Summarize this input" },
        nextStepId: "email-step-1",
      },
      {
        id: "email-step-1",
        type: "ACTION",
        data: { email: "user@example.com" },
        nextStepId: null,
      },
    ],
  };

  const workflow = await prisma.workflow.create({
    data: {
      name: "My First Automation",
      userId: user.id,
      triggerType: "webhook",
      status: "active",
      definition: workflowDefinition,
    },
  });

  console.log("✅ Workflow Created ID:", workflow.id);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
