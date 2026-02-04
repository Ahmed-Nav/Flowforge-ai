// backend/src/engine.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { WorkflowDefinition, WorkflowNode } from "./types";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import fetch from "cross-fetch";
import nodemailer from "nodemailer";
import * as cheerio from "cheerio";
import { recallMemory, saveMemory } from "./memory";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export class WorkflowEngine {
  async runWorkflow(workflowJson: any, runId: string) {
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

        const output = await this.executeNode(node, context, definition);
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

  private async executeNode(
    node: WorkflowNode,
    context: any,
    definition: WorkflowDefinition,
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
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const userPrompt = node.data.prompt || "Summarize this";
        const incomingEdge = (definition.edges || []).find(
          (e) => e.target === node.id,
        );
        const parentOutput = incomingEdge ? context[incomingEdge.source] : {};
        const previousData =
          parentOutput?.result || JSON.stringify(parentOutput) || "";

        let finalPrompt = userPrompt;
        let memoryBlock = "";

        try {
          const memories: any = await recallMemory(userPrompt);
          if (memories && memories.length > 0) {
            console.log(`   🧠 Brainwave! Found ${memories.length} memories.`);
            memoryBlock = memories.map((m: any) => `- ${m.content}`).join("\n");
          }
        } catch (memError) {
          console.warn("   ⚠️ Memory recall failed");
        }

        const hasVariable = userPrompt.includes("{{previous_step}}");

        if (hasVariable) {
          finalPrompt = `
            MY LONG-TERM MEMORY (Background Info):
            ${memoryBlock}
            
            ----------------
            
            TASK:
            ${userPrompt.replace("{{previous_step}}", previousData)}
          `;
        } else {
          finalPrompt = `
            You are an autonomous AI agent. Here is your context:

            ----------------
            1. LONG-TERM MEMORY (Things you learned in the past):
            ${memoryBlock || "(No relevant memories found)"}

            ----------------
            2. IMMEDIATE CONTEXT (Data passed from the previous step):
            ${previousData ? previousData.substring(0, 10000) : "(No input data provided)"}

            ----------------
            3. YOUR TASK (User Instruction):
            ${userPrompt}
            
            INSTRUCTIONS:
            - Use the "Immediate Context" as your primary source.
            - Use "Long-Term Memory" to verify or add background context.
            - Answer the User Instruction directly.
          `;
        }

        console.log(`   🤖 AI START: Sending Prompt...`);

        try {
          const result = await model.generateContent(finalPrompt);
          const responseText = result.response.text();
          console.log("   ✅ AI SUCCESS");
          return { result: responseText };
        } catch (error: any) {
          console.error("   ❌ AI FAILED:", error.message);
          return { error: `AI Failed: ${error.message}` };
        }

      case "ACTION":
        return {
          status: "Action executed",
          target: node.data.email || "unknown",
        };

      case "CONDITION":
        const targetValue = node.data.value || "";
        const conditionType = node.data.condition || "contains";

        const inputEdge = (definition.edges || []).find(
          (e) => e.target === node.id,
        );
        const parentResult = inputEdge ? context[inputEdge.source] : {};
        const inputValue =
          parentResult?.result || JSON.stringify(parentResult) || "";

        console.log(
          `   ⚖️ Checking: "${inputValue.substring(
            0,
            20,
          )}..." ${conditionType} "${targetValue}"`,
        );

        let isTrue = false;
        if (conditionType === "contains") {
          isTrue = inputValue.toLowerCase().includes(targetValue.toLowerCase());
        } else if (conditionType === "equals") {
          isTrue =
            inputValue.trim().toLowerCase() ===
            targetValue.trim().toLowerCase();
        }

        return { result: isTrue ? "TRUE" : "FALSE" };

      case "DISCORD":
        const webhookUrl = node.data.url;
        const msgTemplate = node.data.message || "Alert: {{previous_step}}";

        const discordInputEdge = (definition.edges || []).find(
          (e) => e.target === node.id,
        );
        const discordParent = discordInputEdge
          ? context[discordInputEdge.source]
          : {};
        const discordInputVal =
          discordParent?.result || JSON.stringify(discordParent) || "";

        const finalMessage = msgTemplate.replace(
          "{{previous_step}}",
          discordInputVal,
        );

        console.log(
          `   📢 Sending to Discord: "${finalMessage.substring(0, 30)}..."`,
        );

        if (!webhookUrl) return { error: "No Webhook URL provided" };

        try {
          const res = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: finalMessage }),
          });

          if (!res.ok) throw new Error(`Discord API ${res.status}`);
          return { result: "Message Sent Successfully" };
        } catch (err: any) {
          console.error("   ❌ Discord Failed:", err.message);
          return { error: `Discord Failed: ${err.message}` };
        }

      case "EMAIL":
        const toEmail = node.data.to;
        const subject = node.data.subject || "Alert";
        const bodyTemplate = node.data.body || "{{previous_step}}";

        const emailInputEdge = (definition.edges || []).find(
          (e) => e.target === node.id,
        );
        const emailParent = emailInputEdge
          ? context[emailInputEdge.source]
          : {};
        const emailInputVal =
          emailParent?.result || JSON.stringify(emailParent) || "";
        const finalBody = bodyTemplate.replace(
          "{{previous_step}}",
          emailInputVal,
        );

        console.log(`   📧 EMAIL START: Sending to ${toEmail}...`);

        if (!toEmail) return { error: "No Recipient Email provided" };
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
          console.error("   ❌ EMAIL CONFIG MISSING");
          return { error: "Server missing EMAIL_USER or EMAIL_PASS" };
        }

        try {
          console.log(
            "   🛠️ EMAIL DEBUG v9 (IPv4 Force + Port 465 Secure) - Starting...",
          );

          const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true, // true for 465, false for other ports
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS.replace(/\s/g, ""),
            },
            tls: {
              rejectUnauthorized: false,
            },
            family: 4, // Force IPv4
            connectionTimeout: 30000,
            greetingTimeout: 30000,
            logger: true,
            debug: true,
          } as any);

          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Email Timed Out (60s)")), 60000),
          );

          console.log("   🔌 Connecting to Gmail...");
          console.log("   ✅ Connected to Gmail! Sending mail now...");

          const mailPromise = transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: toEmail,
            subject: subject,
            text: finalBody,
          });

          await Promise.race([mailPromise, timeoutPromise]);

          console.log("   ✅ EMAIL SUCCESS");
          return { result: "Email Sent Successfully" };
        } catch (err: any) {
          console.error("   ❌ EMAIL FAILED:", err.message);
          return { error: `Email Failed: ${err.message}` };
        }

      case "SCRAPER":
        const targetUrl = node.data.url;
        console.log(`   🕷️ SCRAPER START: Visiting ${targetUrl}...`);

        if (!targetUrl) return { error: "No URL provided" };

        try {
          const res = await fetch(targetUrl, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            },
          });

          if (!res.ok) throw new Error(`Scraper HTTP ${res.status}`);
          const html = await res.text();

          const $ = cheerio.load(html);

          $("script").remove();
          $("style").remove();
          $("nav").remove();
          $("footer").remove();

          const rawText = $("body")
            .text()
            .replace(/\s+/g, " ")
            .trim()
            .substring(0, 2000);

          console.log(`   ✅ SCRAPED: ${rawText.length} chars`);
          return { result: rawText };
        } catch (err: any) {
          console.error("   ❌ SCRAPER FAILED:", err.message);
          return { error: `Scraper Failed: ${err.message}` };
        }
      case "SCHEDULE":
        console.log(`   ⏰ SCHEDULE START: ${node.data.time}`);
        return { result: "Scheduled" };

      case "SAVE_MEMORY":
        const contentTemplate = node.data.content || "{{previous_step}}";

        const saveInputEdge = (definition.edges || []).find(
          (e) => e.target === node.id,
        );
        const saveParent = saveInputEdge ? context[saveInputEdge.source] : {};
        const saveInputVal =
          saveParent?.result || JSON.stringify(saveParent) || "";

        const finalContent = contentTemplate.replace(
          "{{previous_step}}",
          saveInputVal,
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

      case "DOCUMENT":
        const docText = node.data.result || "";
        console.log(`   📄 DOCUMENT PASSTHROUGH: ${docText.length} chars`);

        if (!docText)
          return { error: "No document text found. Did you upload a PDF?" };

        return { result: docText };

      default:
        return { error: "Unknown Node Type" };
    }
  }
}
