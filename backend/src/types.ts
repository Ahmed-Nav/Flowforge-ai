// backend/src/types.ts

export interface WorkflowNode {
  id: string;
  type: "TRIGGER" | "ACTION" | "AI";
  data: any; 
  nextStepId?: string | null; 
}

export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  triggerId: string; 
}

export interface ExecutionState {
  workflowId: string;
  runId: string;
  results: Record<string, any>; 
  currentStepId: string | null;
}
