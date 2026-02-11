import imaps from "imap-simple";
import { simpleParser } from "mailparser";
import { PrismaClient } from "@prisma/client";
import { Queue } from "bullmq";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import IORedis from "ioredis";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  tls: redisUrl.startsWith("rediss://")
    ? { rejectUnauthorized: false }
    : undefined,
});

const jobQueue = new Queue("workflow-queue", { connection });

export async function startGmailPolling() {
  console.log("👀 GMAIL WATCHER: Started polling service...");

  checkGmailTriggers();
  setInterval(checkGmailTriggers, 60000);
}

async function checkGmailTriggers() {
  const workflows = await prisma.workflow.findMany({
    where: { isActive: true },
  });

  const gmailWorkflows = workflows.filter((w: any) => {
    const def = w.definition as any;
    const triggerNode = def.nodes.find((n: any) => n.id === def.triggerId);
    return triggerNode && triggerNode.type === "GMAIL_TRIGGER";
  });

  if (gmailWorkflows.length === 0) return;

  console.log(
    `👀 GMAIL WATCHER: Checking ${gmailWorkflows.length} active workflows...`,
  );

  const config = {
    imap: {
      user: process.env.EMAIL_USER || "",
      password: process.env.EMAIL_PASS || "",
      host: "imap.gmail.com",
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      authTimeout: 20000,
      connTimeout: 20000,
    },
  };

  try {
    const connection = await imaps.connect(config);
    await connection.openBox("INBOX");

    for (const workflow of gmailWorkflows) {
      const def = workflow.definition as any;
      const triggerNode = def.nodes.find((n: any) => n.id === def.triggerId);

      const searchCriteria = [triggerNode.data.searchQuery || "UNSEEN"];
      const fetchOptions = { bodies: ["HEADER", "TEXT"], markSeen: true };

      const messages = await connection.search(searchCriteria, fetchOptions);

      if (messages.length > 0) {
        console.log(
          `   🚀 TRIGGER: Found ${messages.length} new emails for Workflow ${workflow.id}`,
        );

        const latestMsg = messages[messages.length - 1];
        const allParts = latestMsg.parts;
        const headerPart = allParts.find((p: any) => p.which === "HEADER");
        const textPart = allParts.find((p: any) => p.which === "TEXT");

        const subject = headerPart?.body?.subject?.[0] || "No Subject";
        const from = headerPart?.body?.from?.[0] || "Unknown";
        const rawBody = textPart?.body || "";

        await jobQueue.add("gmail-trigger", {
          workflowId: workflow.id,
          triggerData: {
            subject,
            from,
            body: rawBody,
            emailId: latestMsg.attributes.uid,
          },
        });
      }
    }

    connection.end();
  } catch (error: any) {
    console.error("❌ GMAIL POLL FAILED:", error.message);
  }
}
