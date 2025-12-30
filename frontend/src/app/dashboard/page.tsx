"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

  if (dataLoading)
    return <div className="p-10 text-white">Loading mission control...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white font-mono p-8">
      <div className="flex justify-between items-center mb-10 border-b border-gray-700 pb-4">
        <h1 className="text-3xl font-bold text-red-500">MISSION CONTROL</h1>
        <div className="space-x-4">
          <Link
            href="/editor"
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-bold uppercase"
          >
            + New Agent
          </Link>
          <button
            onClick={logout}
            className="px-4 py-2 border border-gray-600 hover:bg-gray-800 rounded text-sm uppercase"
          >
            Logout
          </button>
        </div>
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
              className="bg-gray-800 border border-gray-700 p-6 rounded-lg hover:border-red-500 transition shadow-lg"
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
  );
}
