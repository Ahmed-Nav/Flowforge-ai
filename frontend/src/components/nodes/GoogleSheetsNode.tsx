import { Handle, Position, useReactFlow } from "@xyflow/react";
import { Table, Database } from "lucide-react";
import { useState, useEffect } from "react";

export default function GoogleSheetsNode({ data, id }: { data: any; id: string }) {
  const { updateNodeData } = useReactFlow();
  const [sheetId, setSheetId] = useState(data.sheetId || "");
  const [range, setRange] = useState(data.range || "Sheet1!A:A");
  const [splitLines, setSplitLines] = useState(data.splitLines || false);

  useEffect(() => {
    if (data.sheetId !== undefined) setSheetId(data.sheetId);
    if (data.range !== undefined) setRange(data.range);
    if (data.splitLines !== undefined) setSplitLines(data.splitLines);
  }, [data.sheetId, data.range, data.splitLines]);

  const handleChange = (key: string, val: any) => {
    if (key === "sheetId") setSheetId(val);
    if (key === "range") setRange(val);
    if (key === "splitLines") setSplitLines(val);
    updateNodeData(id, { [key]: val });
  };
  return (
    <div className="bg-green-900 border-2 border-green-600 shadow-xl p-4 w-64 rounded-lg font-mono text-white">
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-white !w-3 !h-3"
      />

      <div className="flex items-center gap-2 mb-3 border-b border-green-700 pb-2">
        <Table className="w-5 h-5 text-green-300" />
        <span className="font-bold text-sm text-green-100">GOOGLE SHEETS</span>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-[10px] text-green-300 uppercase tracking-wider">
            Sheet ID
          </label>
          <input
            type="text"
            className="w-full bg-black/50 border border-green-700 rounded p-1 text-xs text-green-100 focus:outline-none focus:border-green-400"
            placeholder="1BxiMvs..."
            value={sheetId}
            onChange={(e) => handleChange("sheetId", e.target.value)}
          />
          <div className="text-[9px] text-gray-400 mt-1">
            Found in the URL of your sheet
          </div>
        </div>

        <div>
          <label className="text-[10px] text-green-300 uppercase tracking-wider">
            Range
          </label>
          <input
            type="text"
            className="w-full bg-black/50 border border-green-700 rounded p-1 text-xs text-green-100 focus:outline-none focus:border-green-400"
            placeholder="Sheet1!A:A"
            value={range}
            onChange={(e) => handleChange("range", e.target.value)}
          />
        </div>

        <div className="pt-2 flex items-center gap-2">
          <input
            type="checkbox"
            id="splitLines"
            checked={splitLines}
            onChange={(e) => handleChange("splitLines", e.target.checked)}
            className="w-4 h-4 cursor-pointer accent-green-500"
          />
          <label
            htmlFor="splitLines"
            className="text-[10px] text-green-300 uppercase tracking-wider cursor-pointer"
          >
            Split lines to columns
          </label>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!bg-white !w-3 !h-3"
      />
    </div>
  );
}
