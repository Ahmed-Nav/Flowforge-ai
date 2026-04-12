"use client";
import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";

interface Props {
    token: string;
    onGraph: (graph: any) => void;
}

export default function NLCompileBar({ token, onGraph }: Props) {
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const compile = async () => {
        if (!input.trim()) return;
        setLoading(true); setError("");
        try {
            const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/compile`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ nl_description: input }),
            });
            if (!r.ok) throw new Error(await r.text());
            const graph = await r.json();
            onGraph(graph);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex gap-2 p-3 border-b border-gray-800 bg-gray-900">
            <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && compile()}
                placeholder="Describe your workflow in plain English..."
                className="flex-1 bg-gray-800 text-white text-sm px-4 py-2 rounded border border-gray-700 focus:border-purple-500 outline-none"
            />
            <button onClick={compile} disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white text-sm rounded transition disabled:opacity-50">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {loading ? "Compiling..." : "Compile"}
            </button>
            {error && <span className="text-red-400 text-xs self-center">{error}</span>}
        </div>
    );
}