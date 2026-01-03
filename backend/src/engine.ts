// backend/src/engine.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { WorkflowDefinition, WorkflowNode } from "./types";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export class WorkflowEngine {
  async runWorkflow(workflowJson: any, runId: string) {
    const definition = workflowJson as WorkflowDefinition;
    let currentStepId: string | null = definition.triggerId;
    const context: Record<string, any> = {};

    console.log(`🚀 Starting Run: ${runId}`);

    try {
      while (currentStepId) {
        const node = definition.nodes.find((n) => n.id === currentStepId);
        if (!node) break;

        const output = await this.executeNode(node, context, definition);

        context[node.id] = output;
        currentStepId = node.nextStepId || null;
      }

      await prisma.workflowRun.update({
        where: { id: runId },
        data: {
          status: "COMPLETED",
          outputs: context,
          completedAt: new Date(),
        },
      });
    } catch (error: any) {
      console.error("Workflow Failed:", error);
      await prisma.workflowRun.update({
        where: { id: runId },
        data: {
          status: "FAILED",
          outputs: { error: error.message },
          completedAt: new Date(),
        },
      });
    }
  }

  private async executeNode(
    node: WorkflowNode,
    context: any,
    definition: WorkflowDefinition
  ) {
    switch (node.type) {
      case "TRIGGER":
        return { message: "Webhook received!" };

      case "AI":
        const promptTemplate =
          node.data.prompt || "Summarize this: {{previous_step}}";

        const incomingEdge = (definition.edges || []).find(
          (e) => e.target === node.id
        );

        let previousText = "";

        if (incomingEdge) {
          const parentOutput = context[incomingEdge.source];
          previousText =
            parentOutput?.result || JSON.stringify(parentOutput) || "";
        } else {
          previousText = "No input data found.";
        }

        const finalPrompt = promptTemplate.replace(
          "{{previous_step}}",
          previousText
        );

        console.log(
          `   🤖 Asking Gemini: "${finalPrompt.substring(0, 50)}..."`
        );

        const result = await model.generateContent(finalPrompt);
        const response = result.response;
        return { result: response.text() };

      case "ACTION":
        return {
          status: "Action executed",
          target: node.data.email || "unknown",
        };

      case "HTTP":
        const url = node.data.url;
        const method = node.data.method || "GET";

        console.log(`   🌐 HTTP ${method}: ${url}`);

        if (!url) return { error: "No URL provided" };

        try {
          const res = await fetch(url, { method });
          const data = await res.json();
          return { result: JSON.stringify(data), status: res.status };
        } catch (err: any) {
          console.error("HTTP Node Error:", err.message);
          return { error: "HTTP Request Failed", details: err.message };
        }
      default:
        return { error: "Unknown Node Type" };
    }
  }
}
