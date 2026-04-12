// backend/src/nodes/sheets.ts
import { WorkflowNode, WorkflowDefinition, NodeHandler } from "../types";
import { getParentOutputValue } from "./utils";
import { google } from "googleapis";
import path from "path";

export const execute: NodeHandler = async (
  node: WorkflowNode,
  context: Record<string, any>,
  definition: WorkflowDefinition,
  _initialData: any,
) => {
  const sheetId = node.data.sheetId;
  const range = node.data.range || "Sheet1!A:A";
  const shouldSplit = node.data.splitLines === true;

  const rawValue = getParentOutputValue(node.id, context, definition);

  let values;

  if (shouldSplit) {
    console.log("   📊 SHEETS: Splitting text into multiple columns.");
    const separatedColumns = rawValue
      .split("\n")
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0);

    values = [[new Date().toISOString(), ...separatedColumns]];
  } else {
    console.log("   📊 SHEETS: Keeping text in a single column.");
    values = [[new Date().toISOString(), rawValue]];
  }

  console.log(`   📊 SHEETS START: Writing to ${sheetId}...`);

  if (!sheetId) return { error: "No Sheet ID provided" };

  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, "../../google-secrets.json"),
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
};
