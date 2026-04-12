// backend/src/nodes/email.ts
import { WorkflowNode, WorkflowDefinition, NodeHandler } from "../types";
import { resolveTemplate } from "./utils";
import nodemailer from "nodemailer";

export const execute: NodeHandler = async (
  node: WorkflowNode,
  context: Record<string, any>,
  definition: WorkflowDefinition,
  _initialData: any,
) => {
  const toEmail = node.data.to;
  const subject = node.data.subject || "Alert";
  const bodyTemplate = node.data.body || "{{previous_step}}";

  const finalBody = resolveTemplate(
    bodyTemplate,
    node.id,
    context,
    definition,
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
};
