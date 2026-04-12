// backend/src/engine.ts
import { WorkflowDefinition, WorkflowNode, NodeHandler } from "./types";
import { prisma } from "./db";

// Node handler registry — each node type maps to its handler
import { execute as executeTrigger } from "./nodes/trigger";
import { execute as executeHttp } from "./nodes/http";
import { execute as executeAI } from "./nodes/ai";
import { execute as executeAction } from "./nodes/action";
import { execute as executeCondition } from "./nodes/condition";
import { execute as executeDiscord } from "./nodes/discord";
import { execute as executeEmail } from "./nodes/email";
import { execute as executeScraper } from "./nodes/scraper";
import { execute as executeSchedule } from "./nodes/schedule";
import { execute as executeSaveMemory } from "./nodes/save-memory";
import { execute as executeDocument } from "./nodes/document";
import { execute as executeSheets } from "./nodes/sheets";
import { execute as executeSlack } from "./nodes/slack";
import { execute as executeNotion } from "./nodes/notion";

const NODE_HANDLERS: Record<string, NodeHandler> = {
  TRIGGER: executeTrigger,
  GMAIL_TRIGGER: executeTrigger,
  HTTP: executeHttp,
  AI: executeAI,
  ACTION: executeAction,
  CONDITION: executeCondition,
  DISCORD: executeDiscord,
  EMAIL: executeEmail,
  SCRAPER: executeScraper,
  SCHEDULE: executeSchedule,
  SAVE_MEMORY: executeSaveMemory,
  DOCUMENT: executeDocument,
  SHEETS: executeSheets,
  SLACK: executeSlack,
  NOTION: executeNotion,
};

export class WorkflowEngine {
  async runWorkflow(workflowJson: any, runId: string, initialData: any = {}) {
    try {
      const definition = workflowJson as WorkflowDefinition;
      let currentStepId: string | null = definition.triggerId;
      const context: Record<string, any> = {};

      console.log(`🚀 Starting Run: ${runId}`);

      if (!definition || !currentStepId) {
        throw new Error("Invalid Workflow Definition: Missing triggerId");
      }

      console.log(
        `🔍 DEBUG: Workflow has ${definition.nodes.length} nodes and ${definition.edges.length} edges.`,
      );

      while (currentStepId) {
        const node = definition.nodes.find((n) => n.id === currentStepId);

        if (!node) {
          console.error(
            `❌ CRITICAL: Could not find node with ID ${currentStepId}`,
          );
          break;
        }

        console.log(`📍 STEP: Executing Node ${node.type} (${node.id})`);

        const output = await this.executeNode(
          node,
          context,
          definition,
          initialData,
        );
        context[node.id] = output;

        if (node.type === "CONDITION") {
          const chosenHandle = output.result === "TRUE" ? "true" : "false";
          console.log(
            `   🔀 Logic Decision: ${chosenHandle.toUpperCase()} path`,
          );

          const nextEdge = (definition.edges || []).find(
            (e) => e.source === node.id && e.sourceHandle === chosenHandle,
          );
          currentStepId = nextEdge ? nextEdge.target : null;
        } else {
          const nextEdge = (definition.edges || []).find(
            (e) => e.source === node.id,
          );

          if (nextEdge) {
            console.log(`   🔗 FOUND LINK: Going to ${nextEdge.target}`);
            currentStepId = nextEdge.target;
          } else {
            console.log(
              `   🛑 DEAD END: No edge found starting from ${node.id}`,
            );
            console.log(`   👀 DEBUG EDGES:`, JSON.stringify(definition.edges));
            currentStepId = null;
          }
        }
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

  public async executeNode(
    node: WorkflowNode,
    context: Record<string, any>,
    definition: WorkflowDefinition,
    initialData: any = {},
  ) {
    const handler = NODE_HANDLERS[node.type];
    if (!handler) {
      throw new Error(`Unknown node type: ${node.type}`);
    }
    return handler(node, context, definition, initialData);
  }
}
