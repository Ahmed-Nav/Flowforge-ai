// backend/src/nodes/scraper.ts
import { WorkflowNode, WorkflowDefinition, NodeHandler } from "../types";
import fetch from "cross-fetch";
import * as cheerio from "cheerio";

export const execute: NodeHandler = async (
  node: WorkflowNode,
  _context: Record<string, any>,
  _definition: WorkflowDefinition,
  _initialData: any,
) => {
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
};
