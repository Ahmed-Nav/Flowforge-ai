// backend/src/nodes/action.ts
import { WorkflowNode, WorkflowDefinition, NodeHandler } from "../types";

export const execute: NodeHandler = async (
  node: WorkflowNode,
  _context: Record<string, any>,
  _definition: WorkflowDefinition,
  _initialData: any,
) => {
  return {
    status: "Action executed",
    target: node.data.email || "unknown",
  };
};
