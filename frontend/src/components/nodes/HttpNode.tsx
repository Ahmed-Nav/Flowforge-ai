import { Handle, Position, useReactFlow } from '@xyflow/react';
import { useState, useCallback, useEffect } from 'react';
import { Globe } from 'lucide-react'; 

export default function HttpNode({ data, id }: { data: any, id: string }) {
  const { setNodes } = useReactFlow();
  const [url, setUrl] = useState(data.url || "https://api.coindesk.com/v1/bpi/currentprice.json");
  const [method, setMethod] = useState(data.method || "GET");

  useEffect(() => {
    if (data.url) setUrl(data.url);
    if (data.method) setMethod(data.method);
  }, [data.url, data.method]);

  const handleUrlChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = evt.target.value;
    setUrl(newVal);

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, url: newVal } };
        }
        return node;
      })
    );
  };

  const handleMethodChange = (evt: React.ChangeEvent<HTMLSelectElement>) => {
    const newVal = evt.target.value;
    setMethod(newVal);

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, method: newVal } };
        }
        return node;
      })
    );
  };

  return (
    <div className="bg-gray-800 border-2 border-blue-500 rounded-lg p-4 shadow-xl w-64 transition-all hover:shadow-blue-500/20">
      <div className="bg-blue-600 -mx-4 -mt-4 mb-4 p-2 rounded-t-lg font-bold text-white text-xs tracking-widest flex items-center gap-2">
        <Globe size={14} /> HTTP_REQUEST
      </div>

      <div className="mb-2">
        <label className="text-gray-400 text-[10px] uppercase font-bold">Method</label>
        <select 
            value={method} 
            onChange={handleMethodChange}
            className="w-full bg-gray-900 text-blue-300 text-xs font-mono p-1 rounded border border-gray-700 outline-none mb-2"
        >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
        </select>
      </div>

      <div className="mb-2">
        <label className="text-gray-400 text-[10px] uppercase font-bold">Target URL</label>
        <input 
          type="text"
          className="w-full bg-gray-900 text-green-400 text-xs font-mono p-2 rounded border border-gray-700 focus:border-blue-500 outline-none"
          value={url}
          onChange={handleUrlChange}
          placeholder="https://api.example.com"
        />
      </div>

      <Handle type="target" position={Position.Left} className="!bg-blue-500 !w-3 !h-3" />
      <div className="text-[9px] text-gray-500 text-right mt-1">RESPONSE &rarr;</div>
      <Handle type="source" position={Position.Right} className="!bg-green-500 !w-3 !h-3" />
    </div>
  );
}