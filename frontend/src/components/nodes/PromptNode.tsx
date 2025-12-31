import { Handle, Position } from "@xyflow/react";
import { useState, useCallback } from "react";

export default function PromptNode({ data, id }: { data: any; id: string }) {
  const [prompt, setPrompt] = useState(
    data.prompt || "Write your instruction here..."
  );

  const handleChange = useCallback(
    (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newVal = evt.target.value;
      setPrompt(newVal);
      data.prompt = newVal;
    },
    [data]
  );

  return (
    <div className="bg-gray-800 border-2 border-red-500 rounded-lg p-4 shadow-xl w-64">
      {/* Header */}
      <div className="bg-red-600 -mx-4 -mt-4 mb-4 p-2 rounded-t-lg font-bold text-white text-xs tracking-widest flex items-center gap-2">
        <span>🤖</span> AI_INSTRUCTION_NODE
      </div>

      <div className="mb-2">
        <label className="text-gray-400 text-[10px] uppercase font-bold">
          System Prompt
        </label>
        <textarea
          className="w-full h-24 bg-gray-900 text-green-400 text-xs font-mono p-2 rounded border border-gray-700 focus:border-red-500 outline-none resize-none mt-1"
          value={prompt}
          onChange={handleChange}
          placeholder="e.g., Summarize this text..."
        />
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="!bg-blue-500 !w-3 !h-3"
      />
      <div className="text-[9px] text-gray-500 text-right mt-1">
        INPUT &rarr; OUTPUT
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-green-500 !w-3 !h-3"
      />
    </div>
  );
}
