// backend/src/worker.ts
import "dotenv/config";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { prisma } from "./db";
import { WorkflowEngine } from "./engine";
import { runLangGraph } from "./langgraph_engine";
import express from "express";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});

const engine = new WorkflowEngine();

console.log("👷 WORKER STARTED: Listening for jobs...");

export const worker = new Worker(
  "workflow-queue",
  async (job) => {
    console.log(`[Worker] Processing Job: ${job.id}`);

    let { runId, definition, workflowId, triggerData } = job.data;

    if (runId === "scheduled") {
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
      });

      if (!workflow) {
        return { status: "SKIPPED", reason: "Workflow Deleted" };
      }

      if (workflow.isActive === false) {
        return { status: "SKIPPED", reason: "Workflow Paused" };
      }

      try {
        console.log(`⏰ Creating Run Record for Workflow: ${workflowId}`);
        const newRun = await prisma.workflowRun.create({
          data: {
            workflowId: workflowId,
            status: "PENDING",
            triggerInput: { type: "cron" },
            outputs: {},
          },
        });
        runId = newRun.id;
        console.log(`✅ Created Scheduled Run ID: ${runId}`);
      } catch (err: any) {
        console.error("❌ Failed to create run record:", err);
        return;
      }
    }

    if (triggerData) {
      console.log(`   📧 Injecting Email Data into Workflow Start Node...`);

      const triggerNode = definition.nodes.find(
        (n: any) => n.id === definition.triggerId,
      );

      if (triggerNode) {
        triggerNode.data.initialPayload = triggerData;
      }
    }

    try {
      const useLangGraph = definition.compiledByDSPy === true
        || process.env.FORCE_LANGGRAPH === "true";

      if (useLangGraph) {
        console.log("Using LangGraph executor");
        await runLangGraph(definition, runId);
      } else {
        console.log("Using legacy engine");
        await engine.runWorkflow(definition, runId);
      }
      return { status: "COMPLETED", runId };
    } catch (error: any) {
      console.error(`[Worker] Job Failed: ${error.message}`);
      throw error;
    }
  },
  { connection },
);

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/health", (req, res) => res.send("Worker is alive!"));

app.listen(PORT, () => {
  console.log(`❤️ Health check server running on port ${PORT}`);
});
