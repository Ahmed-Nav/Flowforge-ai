import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { prisma } from "./db";
import { TaskType } from "@google/generative-ai";

const embeddingConfig = {
  model: "gemini-embedding-001",
  apiKey: process.env.GEMINI_API_KEY,
};

function getDocumentEmbeddings() {
  return new GoogleGenerativeAIEmbeddings({
    ...embeddingConfig,
    taskType: TaskType.RETRIEVAL_DOCUMENT,
  });
}

function getQueryEmbeddings() {
  return new GoogleGenerativeAIEmbeddings({
    ...embeddingConfig,
    taskType: TaskType.RETRIEVAL_QUERY,
  });
}

export async function saveMemory(content: string, metadata: any = {}) {
  try {
    console.log(`🧠 Memorizing: "${content.substring(0, 30)}..."`);

    const vector = await getDocumentEmbeddings().embedQuery(content);
    const vectorString = `[${vector.join(",")}]`;

    await prisma.$executeRaw`
      INSERT INTO "Document" (id, content, metadata, embedding, "createdAt")
      VALUES (gen_random_uuid(), ${content}, ${metadata}, ${vectorString}::vector, NOW());
    `;

    console.log("✅ Memory Saved Successfully!");
    return true;
  } catch (error) {
    console.error("❌ Memory Save Failed:", error);
    return false;
  }
}

export async function recallMemory(query: string, limit = 3) {
  console.log(`🧠 [DEBUG] Starting Recall for: "${query}"`);

  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("CRITICAL: GEMINI_API_KEY is missing in Worker!");
    }

    console.log("🧠 [DEBUG] Generating Vector...");
    const vector = await getQueryEmbeddings().embedQuery(query);

    console.log("🧠 [DEBUG] Vector Generated. Querying DB...");
    const vectorString = `[${vector.join(",")}]`;

    const results = await prisma.$queryRaw`
      SELECT id, content, metadata
      FROM "Document"
      ORDER BY embedding <=> ${vectorString}::vector ASC
      LIMIT ${limit};
    `;

    console.log(
      `🧠 [DEBUG] DB returned ${Array.isArray(results) ? results.length : 0} results`,
    );
    return results;
  } catch (error) {
    console.error("❌ Memory Recall Failed:", error);
    return [];
  }
}
