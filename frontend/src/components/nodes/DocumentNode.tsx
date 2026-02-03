import { Handle, Position } from "@xyflow/react";
import { FileText, Upload, CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function DocumentNode({ data }: any) {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState(data.fileName || "");
  const [error, setError] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Only PDF files allowed");
      return;
    }

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tools/parse-pdf`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!res.ok) throw new Error("Parse failed");

      const result = await res.json();

      data.result = result.text;
      data.fileName = file.name;
      setFileName(file.name);
    } catch (err) {
      setError("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-slate-900 border-2 border-slate-600 shadow-xl p-4 w-72 rounded-lg font-mono text-white">
      <div className="flex items-center gap-2 mb-3 border-b border-slate-700 pb-2">
        <FileText className="w-5 h-5 text-blue-400" />
        <span className="font-bold text-sm text-blue-100">DOCUMENT READER</span>
      </div>

      <div className="space-y-3">
        <div className="bg-black/50 p-3 rounded border border-slate-700 text-center">
          {fileName ? (
            <div className="text-green-400 flex flex-col items-center gap-1">
              <CheckCircle size={20} />
              <span className="text-xs break-all">{fileName}</span>
              <span className="text-[10px] text-gray-500">
                Text Extracted & Ready
              </span>
            </div>
          ) : (
            <div className="text-gray-500 text-xs">No document loaded</div>
          )}
        </div>

        <label
          className={`
          flex items-center justify-center gap-2 w-full py-2 rounded cursor-pointer transition-all
          ${uploading ? "bg-gray-700 cursor-not-allowed" : "bg-blue-700 hover:bg-blue-600"}
        `}
        >
          <Upload size={14} />
          <span className="text-xs font-bold">
            {uploading ? "PARSING..." : fileName ? "REPLACE PDF" : "UPLOAD PDF"}
          </span>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-[10px]">
            <AlertCircle size={10} /> {error}
          </div>
        )}

        <div className="text-[9px] text-gray-500 text-center">
          * Extracting text for downstream use.
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!bg-blue-500 !w-3 !h-3 !border-2 !border-black"
      />
    </div>
  );
}
