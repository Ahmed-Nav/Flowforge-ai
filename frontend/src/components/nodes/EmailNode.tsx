import { Handle, Position, useReactFlow } from "@xyflow/react";
import { useState, useEffect } from "react";
import { Mail } from "lucide-react";

export default function EmailNode({ data, id }: { data: any; id: string }) {
  const { updateNodeData } = useReactFlow();
  const [to, setTo] = useState(data.to || "");
  const [subject, setSubject] = useState(data.subject || "");
  const [body, setBody] = useState(data.body || "");

  useEffect(() => {
    if (data.to !== undefined) setTo(data.to);
    if (data.subject !== undefined) setSubject(data.subject);
    if (data.body !== undefined) setBody(data.body);
  }, [data.to, data.subject, data.body]);

  const handleChange = (key: string, val: string) => {
    if (key === "to") setTo(val);
    if (key === "subject") setSubject(val);
    if (key === "body") setBody(val);
    updateNodeData(id, { [key]: val });
  };

  return (
    <div className="bg-gray-800 border-2 border-yellow-500 rounded-lg p-4 shadow-xl w-64">
      <div className="bg-yellow-600 -mx-4 -mt-4 mb-4 p-2 rounded-t-lg font-bold text-white text-xs tracking-widest flex items-center gap-2">
        <Mail size={14} /> EMAIL_SENDER
      </div>

      <div className="mb-2">
        <label className="text-gray-400 text-[10px] uppercase font-bold">
          To (Email)
        </label>
        <input
          type="email"
          value={to}
          onChange={(e) => handleChange("to", e.target.value)}
          placeholder="ceo@company.com"
          className="w-full bg-gray-900 text-yellow-300 text-xs font-mono p-2 rounded border border-gray-700 focus:border-yellow-500 outline-none"
        />
      </div>

      <div className="mb-2">
        <label className="text-gray-400 text-[10px] uppercase font-bold">
          Subject
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => handleChange("subject", e.target.value)}
          placeholder="Alert: Important Update"
          className="w-full bg-gray-900 text-white text-xs font-mono p-2 rounded border border-gray-700 focus:border-yellow-500 outline-none"
        />
      </div>

      <div className="mb-2">
        <label className="text-gray-400 text-[10px] uppercase font-bold">
          Body
        </label>
        <textarea
          value={body}
          onChange={(e) => handleChange("body", e.target.value)}
          placeholder="Message content: {{previous_step}}"
          className="w-full h-20 bg-gray-900 text-white text-xs font-mono p-2 rounded border border-gray-700 focus:border-yellow-500 outline-none resize-none"
        />
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="!bg-blue-500 !w-3 !h-3"
      />
    </div>
  );
}
