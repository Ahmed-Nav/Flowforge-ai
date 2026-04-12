// backend/src/nodes/save-memory.ts
import { WorkflowNode, WorkflowDefinition, NodeHandler } from "../types";
import { resolveTemplate } from "./utils";
import { saveMemory } from "../memory";

export const execute: NodeHandler = async (
  node: WorkflowNode,
  context: Record<string, any>,
  definition: WorkflowDefinition,
  _initialData: any,
) => {
  const contentTemplate = node.data.content || "{{previous_step}}";

  const finalContent = resolveTemplate(
    contentTemplate,
    node.id,
    context,
    definition,
  );

  console.log(
    `   💾 MEMORY SAVE: Storing "${finalContent.substring(0, 30)}..."`,
  );

  if (!finalContent) return { error: "No content to save" };

  try {
    const saved = await saveMemory(finalContent, {
      source: "workflow_node",
    });

    if (saved) return { result: "Memory Saved Successfully" };
    else throw new Error("Database Write Failed");
  } catch (err: any) {
    console.error("   ❌ SAVE FAILED:", err.message);
    return { error: `Save Failed: ${err.message}` };
  }
};
