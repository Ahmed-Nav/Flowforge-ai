// backend/src/nodes/schedule.ts
import { WorkflowNode, WorkflowDefinition, NodeHandler } from "../types";

export const execute: NodeHandler = async (
  node: WorkflowNode,
  _context: Record<string, any>,
  _definition: WorkflowDefinition,
  _initialData: any,
) => {
  console.log(`   ⏰ SCHEDULE START: ${node.data.time}`);
  return { result: "Scheduled" };
};
