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
import { google } from "googleapis";
import path from "path";
import Groq from "groq-sdk";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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

  private async executeNode(
    node: WorkflowNode,
    context: any,
    definition: WorkflowDefinition,
    initialData: any = {},
  ) {
    switch (node.type) {
      case "TRIGGER":
      case "GMAIL_TRIGGER":
        console.log("   🚀 TRIGGER EXECUTION: Injecting Email Data...");
        return {
          message: "Workflow Triggered",
          ...(node.data.initialPayload || {}),
          ...initialData,
        };

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
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        const userPrompt = node.data.prompt || "Analyze this";
        const incomingEdge = (definition.edges || []).find(
          (e) => e.target === node.id,
        );
        const parentOutput = incomingEdge ? context[incomingEdge.source] : {};

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
            secure: true,
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS.replace(/\s/g, ""),
            },
            tls: {
              rejectUnauthorized: false,
            },
            family: 4,
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

      case "SHEETS":
        const sheetId = node.data.sheetId;
        const range = node.data.range || "Sheet1!A:A";
        const sheetInputEdge = (definition.edges || []).find(
          (e) => e.target === node.id,
        );
        const sheetParent = sheetInputEdge
          ? context[sheetInputEdge.source]
          : {};
        const rawValue =
          sheetParent?.result || JSON.stringify(sheetParent) || "";

        const values = [[new Date().toISOString(), rawValue]];

        console.log(`   📊 SHEETS START: Writing to ${sheetId}...`);

        if (!sheetId) return { error: "No Sheet ID provided" };

        try {
          const auth = new google.auth.GoogleAuth({
            keyFile: path.join(__dirname, "../google-secrets.json"),
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
          });

          const sheets = google.sheets({ version: "v4", auth });

          await sheets.spreadsheets.values.append({
            spreadsheetId: sheetId,
            range: range,
            valueInputOption: "USER_ENTERED",
            requestBody: {
              values: values,
            },
          });

          console.log("   ✅ SHEETS SUCCESS: Row Added");
          return { result: "Row Added to Sheet" };
        } catch (err: any) {
          console.error("   ❌ SHEETS FAILED:", err.message);
          return { error: `Sheets Error: ${err.message}` };
        }

      case "SLACK":
        const slackUrl = node.data.url;
        const slackTemplate = node.data.message || "Update: {{previous_step}}";

        const slackInputEdge = (definition.edges || []).find(
          (e) => e.target === node.id,
        );
        const slackParent = slackInputEdge
          ? context[slackInputEdge.source]
          : {};
        const slackInputVal =
          slackParent?.result || JSON.stringify(slackParent) || "";

        const finalSlackMessage = slackTemplate.replace(
          "{{previous_step}}",
          slackInputVal,
        );

        console.log(
          `   📢 Sending to Slack: "${finalSlackMessage.substring(0, 30)}..."`,
        );

        if (!slackUrl) return { error: "No Slack Webhook URL provided" };

        try {
          const res = await fetch(slackUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: finalSlackMessage }),
          });

          const responseText = await res.text();
          if (responseText !== "ok")
            throw new Error(`Slack Error: ${responseText}`);

          return { result: "Slack Message Sent" };
        } catch (err: any) {
          console.error("   ❌ Slack Failed:", err.message);
          return { error: `Slack Failed: ${err.message}` };
        }

      case "NOTION":
        const { Client } = require("@notionhq/client");
        const notion = new Client({ auth: process.env.NOTION_API_KEY });

        const dbId = node.data.databaseId;
        const noteContent = node.data.content || "{{previous_step}}";

        const notionInputEdge = (definition.edges || []).find(
          (e) => e.target === node.id,
        );
        const notionParent = notionInputEdge
          ? context[notionInputEdge.source]
          : {};
        const notionInputVal =
          notionParent?.result || JSON.stringify(notionParent) || "";

        const finalContents = noteContent.replace(
          "{{previous_step}}",
          notionInputVal,
        );

        console.log(`   📝 NOTION START: Writing to DB ${dbId}...`);

        if (!process.env.NOTION_API_KEY)
          return { error: "Server missing NOTION_API_KEY" };
        if (!dbId) return { error: "No Database ID provided" };

        try {
          const response = await notion.pages.create({
            parent: { database_id: dbId },
            properties: {
              Name: {
                title: [{ text: { content: "FlowForge Auto-Entry" } }],
              },
            },
            children: [
              {
                object: "block",
                type: "paragraph",
                paragraph: {
                  rich_text: [
                    { type: "text", text: { content: finalContents } },
                  ],
                },
              },
            ],
          });

          console.log("   ✅ NOTION SUCCESS");
          return { result: `Page Created: ${response.url}` };
        } catch (err: any) {
          console.error("   ❌ NOTION FAILED:", err.message);
          return { error: `Notion Failed: ${err.message}` };
        }

      default:
        return { error: "Unknown Node Type" };
    }
  }
}
