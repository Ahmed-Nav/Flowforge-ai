"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { Trash2 } from "lucide-react";

interface Workflow {
  id: string;
  name: string;
  status: string;
  createdAt: string;
}

export default function Dashboard() {
  const { token, logout, isAuthenticated, loading: authLoading } = useAuth();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchWorkflows = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/workflows`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setWorkflows(data);
        }
      } catch (error) {
        console.error("Failed to fetch workflows", error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchWorkflows();
  }, [isAuthenticated, authLoading, token, router]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (
      !confirm(
        "Are you sure you want to delete this agent? This cannot be undone."
      )
    )
      return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/workflows/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        setWorkflows((prev) => prev.filter((w) => w.id !== id));
      } else {
        alert("Failed to delete workflow");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (dataLoading)
    return <div className="p-10 text-white">Loading mission control...</div>;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-900 text-white font-mono p-8 pt-12">
        <div className="flex justify-between items-end mb-12 border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-red-500">MISSION CONTROL</h1>
            <p className="text-gray-400 text-sm">
              Manage and deploy your autonomous AI agents.
            </p>
          </div>
          <Link
            href="/editor"
            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded uppercase tracking-wider transition shadow-lg hover:shadow-red-900/20"
          >
            <span>+</span> New Agent
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.length === 0 ? (
            <div className="text-gray-500 col-span-full text-center py-20">
              No active agents found. Initialize one above.
            </div>
          ) : (
            workflows.map((wf) => (
              <div
                key={wf.id}
                className="relative group bg-gray-800 border border-gray-700 p-6 rounded-lg hover:border-red-500 transition shadow-lg"
              >
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold text-white truncate">
                    {wf.name}
                  </h2>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      wf.status === "active"
                        ? "bg-green-900 text-green-300"
                        : "bg-yellow-900 text-yellow-300"
                    }`}
                  >
                    {wf.status}
                  </span>
                </div>
                <p className="text-gray-400 text-xs mb-6">
                  ID: {wf.id.slice(0, 8)}...
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-xs">
                    {new Date(wf.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={(e) => handleDelete(e, wf.id)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 z-20 p-2 bg-gray-900/50 rounded-full"
                    title="Delete Agent"
                  >
                    <Trash2 size={18} />
                  </button>
                  <Link
                    href={`/editor?id=${wf.id}`}
                    className="text-red-400 hover:text-red-300 text-sm hover:underline"
                  >
                    Open Console &rarr;
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
