// frontend/src/lib/nodeTypes.ts — Single source of truth for node type mappings

/**
 * Maps backend node types to frontend React Flow node component types.
 * Used when loading workflows from the API.
 */
export const BACKEND_TO_FRONTEND_TYPE: Record<string, string> = {
  AI: "promptNode",
  TRIGGER: "retro",
  HTTP: "httpNode",
  CONDITION: "conditionNode",
  DISCORD: "discordNode",
  EMAIL: "emailNode",
  SCRAPER: "scraperNode",
  SCHEDULE: "scheduleNode",
  SAVE_MEMORY: "saveMemoryNode",
  DOCUMENT: "documentNode",
  SHEETS: "sheetsNode",
  GMAIL_TRIGGER: "gmailTrigger",
  SLACK: "slackNode",
  NOTION: "notionNode",
};

/**
 * Maps frontend React Flow node component types back to backend types.
 * Used when deploying/saving workflows to the API.
 *
 * Some frontend types also need to check node.data.type (e.g. "trigger", "ai"),
 * so this map handles the node.type-based mappings. The data.type-based
 * overrides are applied separately in the deploy logic.
 */
export const FRONTEND_TO_BACKEND_TYPE: Record<string, string> = {
  promptNode: "AI",
  retro: "TRIGGER",
  httpNode: "HTTP",
  conditionNode: "CONDITION",
  discordNode: "DISCORD",
  emailNode: "EMAIL",
  scraperNode: "SCRAPER",
  scheduleNode: "SCHEDULE",
  saveMemoryNode: "SAVE_MEMORY",
  documentNode: "DOCUMENT",
  sheetsNode: "SHEETS",
  gmailTrigger: "GMAIL_TRIGGER",
  slackNode: "SLACK",
  notionNode: "NOTION",
};
