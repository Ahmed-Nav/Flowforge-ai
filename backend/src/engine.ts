// backend/src/engine.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { WorkflowDefinition, WorkflowNode } from "./types";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import fetch from "cross-fetch";

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

      case "HTTP":
        const url = node.data.url;
        const method = node.data.method || "GET";
        console.log(`   🌐 HTTP START: ${method} ${url}`);

        if (!url) return { error: "No URL provided" };

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            signal: controller.signal, // Connects the timer
          });

          clearTimeout(timeoutId); 

          if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);

          const data = await res.json();
          console.log("   ✅ HTTP SUCCESS");
          return { result: JSON.stringify(data), status: res.status };
        } catch (err: any) {
          console.error("   ❌ HTTP FAILED:", err.message);
          return { error: `HTTP Failed: ${err.message}` };
        }

      case "AI":
        const promptTemplate =
          node.data.prompt || "Summarize this: {{previous_step}}";
        const incomingEdge = (definition.edges || []).find(
          (e) => e.target === node.id
        );
        const parentOutput = incomingEdge ? context[incomingEdge.source] : {};
        const previousText =
          parentOutput?.result || JSON.stringify(parentOutput) || "No input";

        const finalPrompt = promptTemplate.replace(
          "{{previous_step}}",
          previousText
        );
        console.log(`   🤖 AI START: Asking Gemini...`);

        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Gemini Timed Out (10s)")), 10000)
          );

          const aiPromise = model.generateContent(finalPrompt);
          const result: any = await Promise.race([aiPromise, timeoutPromise]);

          console.log("   ✅ AI SUCCESS");
          return { result: result.response.text() };
        } catch (error: any) {
          console.error("   ❌ AI FAILED:", error.message);
          return { error: `AI Failed: ${error.message}` };
        }

      case "ACTION":
        return {
          status: "Action executed",
          target: node.data.email || "unknown",
        };

      default:
        return { error: "Unknown Node Type" };
    }
  }
}
