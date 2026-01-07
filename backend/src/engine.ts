// backend/src/engine.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { WorkflowDefinition, WorkflowNode } from "./types";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import fetch from "cross-fetch";
import nodemailer from "nodemailer";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export class WorkflowEngine {
  async runWorkflow(workflowJson: any, runId: string) {
    const definition = workflowJson as WorkflowDefinition;
    let currentStepId: string | null = definition.triggerId;
    const context: Record<string, any> = {};

    console.log(`🚀 Starting Run: ${runId}`);

    try {
      while (currentStepId) {
        const node = definition.nodes.find((n) => n.id === currentStepId);
        if (!node) break;

        const output = await this.executeNode(node, context, definition);
        context[node.id] = output;

        if (node.type === "CONDITION") {
          const chosenHandle = output.result === "TRUE" ? "true" : "false";
          console.log(
            `   🔀 Logic Decision: ${chosenHandle.toUpperCase()} path`
          );

          const nextEdge = (definition.edges || []).find(
            (e) => e.source === node.id && e.sourceHandle === chosenHandle
          );
          currentStepId = nextEdge ? nextEdge.target : null;
        } else {
          const nextEdge = (definition.edges || []).find(
            (e) => e.source === node.id
          );
          currentStepId = nextEdge ? nextEdge.target : null;
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
    definition: WorkflowDefinition
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
        const promptTemplate =
          node.data.prompt || "Summarize this: {{previous_step}}";
        const incomingEdge = (definition.edges || []).find(
          (e) => e.target === node.id
        );
        const parentOutput = incomingEdge ? context[incomingEdge.source] : {};
        const previousText =
          parentOutput?.result || JSON.stringify(parentOutput) || "No input";

        const finalPrompt = promptTemplate.replace(
          "{{previous_step}}",
          previousText
        );
        console.log(`   🤖 AI START: Asking Gemini...`);

        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Gemini Timed Out (10s)")), 10000)
          );

          const aiPromise = model.generateContent(finalPrompt);
          const result: any = await Promise.race([aiPromise, timeoutPromise]);

          console.log("   ✅ AI SUCCESS");
          return { result: result.response.text() };
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
          (e) => e.target === node.id
        );
        const parentResult = inputEdge ? context[inputEdge.source] : {};
        const inputValue =
          parentResult?.result || JSON.stringify(parentResult) || "";

        console.log(
          `   ⚖️ Checking: "${inputValue.substring(
            0,
            20
          )}..." ${conditionType} "${targetValue}"`
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
          (e) => e.target === node.id
        );
        const discordParent = discordInputEdge
          ? context[discordInputEdge.source]
          : {};
        const discordInputVal =
          discordParent?.result || JSON.stringify(discordParent) || "";

        const finalMessage = msgTemplate.replace(
          "{{previous_step}}",
          discordInputVal
        );

        console.log(
          `   📢 Sending to Discord: "${finalMessage.substring(0, 30)}..."`
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
          (e) => e.target === node.id
        );
        const emailParent = emailInputEdge
          ? context[emailInputEdge.source]
          : {};
        const emailInputVal =
          emailParent?.result || JSON.stringify(emailParent) || "";
        const finalBody = bodyTemplate.replace(
          "{{previous_step}}",
          emailInputVal
        );

        console.log(`   📧 EMAIL START: Sending to ${toEmail}...`);

        if (!toEmail) return { error: "No Recipient Email provided" };
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
          console.error("   ❌ EMAIL CONFIG MISSING");
          return { error: "Server missing EMAIL_USER or EMAIL_PASS" };
        }

        try {
          console.log("   🛠️ EMAIL DEBUG MODE v2 (Port 587) - Starting...");

          const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false, 
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS.replace(/\s/g, ""),
            },
            logger: true,
            debug: true,
          });

          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Email Timed Out (30s)")), 30000)
          );

          console.log("   🔌 Connecting to Gmail...");

          await Promise.race([transporter.verify(), timeoutPromise]);
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

      default:
        return { error: "Unknown Node Type" };
    }
  }
}
