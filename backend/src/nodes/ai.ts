// backend/src/nodes/ai.ts
import { WorkflowNode, WorkflowDefinition, NodeHandler } from "../types";
import { getParentOutput } from "./utils";
import { recallMemory } from "../memory";
import Groq from "groq-sdk";

export const execute: NodeHandler = async (
  node: WorkflowNode,
  context: Record<string, any>,
  definition: WorkflowDefinition,
  _initialData: any,
) => {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const userPrompt = node.data.prompt || "Analyze this";
  const parentOutput = getParentOutput(node.id, context, definition);

  let previousData = "";
  if (typeof parentOutput === "string") {
    previousData = parentOutput;
  } else if (parentOutput?.result) {
    previousData = parentOutput.result;
  } else {
    previousData = JSON.stringify(parentOutput);
  }

  let memoryBlock = "";
  try {
    const memories: any = await recallMemory(userPrompt);
    if (memories && memories.length > 0) {
      console.log(
        `   🧠 Brainwave! Accessing ${memories.length} memories...`,
      );
      memoryBlock = memories.map((m: any) => `- ${m.content}`).join("\n");
    }
  } catch (memError) {
    /* ignore memory errors to keep workflow running */
  }

  let finalContext = `
            INPUT CONTEXT:
            ${previousData ? previousData.substring(0, 10000) : "(No input data)"}

            LONG-TERM MEMORY:
            ${memoryBlock || "(No relevant memories found)"}
        `;

  if (userPrompt.includes("{{previous_step}}")) {
    finalContext = userPrompt.replace("{{previous_step}}", previousData);
    if (memoryBlock)
      finalContext += `\n\n(Relevant Memory: ${memoryBlock})`;
  }

  console.log(`   🤖 GROQ START: Thinking...`);

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are an expert AI Automation Agent. Execute the user's instruction using the provided context. Return only the result, no conversational filler.",
        },
        {
          role: "user",
          content: `CONTEXT:\n${finalContext}\n\nINSTRUCTION:\n${userPrompt}`,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_completion_tokens: 1024,
    });

    const responseText = completion.choices[0]?.message?.content || "";
    console.log("   ✅ GROQ SUCCESS");
    return { result: responseText };
  } catch (error: any) {
    console.error("   ❌ GROQ FAILED:", error.message);

    if (error.status === 429) {
      return { error: "Rate Limit Hit (Groq). Try adding a delay node." };
    }
    return { error: `Groq Failed: ${error.message}` };
  }
};
