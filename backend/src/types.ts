// backend/src/types.ts

export interface WorkflowNode {
  id: string;
  type:
    | "TRIGGER"
    | "GMAIL_TRIGGER"
    | "ACTION"
    | "AI"
    | "HTTP"
    | "CONDITION"
    | "DISCORD"
    | "EMAIL"
    | "SCRAPER"
    | "SCHEDULE"
    | "SAVE_MEMORY"
    | "DOCUMENT"
    | "SHEETS"
    | "SLACK"
    | "NOTION";
  data: any;
  nextStepId?: string | null;
}

export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  triggerId: string;
  edges: any[];
  compiledByDSPy?: boolean;
}

export interface ExecutionState {
  workflowId: string;
  runId: string;
  results: Record<string, any>;
  currentStepId: string | null;
}

/** Handler function signature for individual node executors */
export type NodeHandler = (
  node: WorkflowNode,
  context: Record<string, any>,
  definition: WorkflowDefinition,
  initialData: any,
) => Promise<any>;
