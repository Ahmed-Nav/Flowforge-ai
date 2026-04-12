// backend/src/nodes/trigger.ts
import { WorkflowNode, WorkflowDefinition, NodeHandler } from "../types";

export const execute: NodeHandler = async (
  node: WorkflowNode,
  _context: Record<string, any>,
  _definition: WorkflowDefinition,
  initialData: any,
) => {
  console.log("   🚀 TRIGGER EXECUTION: Injecting Email Data...");
  return {
    message: "Workflow Triggered",
    ...(node.data.initialPayload || {}),
    ...initialData,
  };
};
