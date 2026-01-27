import { Handle, Position, useReactFlow } from "@xyflow/react";
import { useState, useEffect } from "react";
import { ScanSearch } from "lucide-react"; // Make sure you have this icon or use another

export default function ScraperNode({ data, id }: { data: any; id: string }) {
  const { updateNodeData } = useReactFlow();
  const [url, setUrl] = useState(data.url || "");

  useEffect(() => {
    if (data.url !== undefined) setUrl(data.url);
  }, [data.url]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setUrl(newVal);
    updateNodeData(id, { url: newVal });
  };

  return (
    <div className="bg-gray-800 border-2 border-orange-500 rounded-lg p-4 shadow-xl w-64">
      {/* Header */}
      <div className="bg-orange-600 -mx-4 -mt-4 mb-4 p-2 rounded-t-lg font-bold text-white text-xs tracking-widest flex items-center gap-2">
        <ScanSearch size={14} /> WEB_SCRAPER
      </div>

      {/* URL Input */}
      <div className="mb-2">
        <label className="text-gray-400 text-[10px] uppercase font-bold">
          Website URL
        </label>
        <input
          type="text"
          value={url}
          onChange={handleChange}
          placeholder="https://example.com"
          className="w-full bg-gray-900 text-orange-300 text-xs font-mono p-2 rounded border border-gray-700 focus:border-orange-500 outline-none"
        />
      </div>

      <div className="text-[9px] text-gray-500 mt-2">
        Extracts raw text from the webpage.
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="!bg-blue-500 !w-3 !h-3"
      />
      <div className="text-[9px] text-gray-500 text-right mt-1">
        TEXT &rarr;
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-green-500 !w-3 !h-3"
      />
    </div>
  );
}
