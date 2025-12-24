import { X, Save } from "lucide-react";
import { useEffect, useState } from "react";

interface ConfigPanelProps {
  selectedNodeId: string | null;
  nodes: any[];
  setNodes: (nodes: any[]) => void;
  onClose: () => void;
}

export default function ConfigPanel({
  selectedNodeId,
  nodes,
  setNodes,
  onClose,
}: ConfigPanelProps) {
  const [prompt, setPrompt] = useState("");
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  useEffect(() => {
    if (selectedNode) {
      setPrompt(selectedNode.data.prompt || "");
    }
  }, [selectedNodeId, selectedNode]);

  if (!selectedNodeId || !selectedNode) return null;

  const handleSave = () => {
    setNodes(
      nodes.map((n) => {
        if (n.id === selectedNodeId) {
          return {
            ...n,
            data: { ...n.data, prompt: prompt }, 
          };
        }
        return n;
      })
    );
    onClose();
  };

  return (
    <div className="absolute top-0 right-0 h-full w-80 bg-white border-l-4 border-retro-dark shadow-[-4px_0px_0px_#1D1D1D] z-30 flex flex-col">
      <div className="bg-retro-primary p-4 border-b-4 border-retro-dark flex justify-between items-center">
        <h2 className="text-white font-bold text-xl uppercase font-pixel">
          CONFIG_NODE_{selectedNodeId}
        </h2>
        <button
          onClick={onClose}
          className="text-white hover:bg-black/20 p-1 rounded"
        >
          <X size={24} />
        </button>
      </div>

      <div className="p-6 flex-1 bg-retro-bg">
        <label className="block text-retro-dark font-bold mb-2 font-pixel text-lg">
          AI_INSTRUCTION (PROMPT):
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full h-48 border-4 border-retro-dark p-4 font-mono text-sm focus:outline-none focus:shadow-pixel transition-all"
          placeholder="Ex: Write a poem about {{previous_step}}..."
        />
        <p className="text-xs mt-2 opacity-60 font-mono">
        Tip: Use <span className="font-bold">{`{{ previous_step }}`}</span> to
          insert data from the trigger.
        </p>
      </div>

      <div className="p-4 border-t-4 border-retro-dark bg-white">
        <button
          onClick={handleSave}
          className="w-full bg-green-500 text-white font-bold py-3 border-2 border-retro-dark shadow-pixel hover:translate-y-1 hover:shadow-none transition-all flex justify-center items-center gap-2"
        >
          <Save size={20} />
          SAVE_CONFIG
        </button>
      </div>
    </div>
  );
}
