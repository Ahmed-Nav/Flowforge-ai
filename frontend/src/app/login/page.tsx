"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false); 
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const endpoint = isRegister ? "/auth/register" : "/auth/login";
    const url = `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Authentication failed");

      if (isRegister) {
        alert("Account created! Please log in.");
        setIsRegister(false);
      } else {
        login(data.token, data.email);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-red-500">
          {isRegister ? "Create Account" : "Welcome Back"}
        </h1>

        {error && <p className="mb-4 text-red-400 text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 bg-gray-700 rounded border border-gray-600 focus:border-red-500 outline-none"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 bg-gray-700 rounded border border-gray-600 focus:border-red-500 outline-none"
            required
          />
          <button className="w-full py-3 bg-red-600 hover:bg-red-700 rounded font-bold transition">
            {isRegister ? "Sign Up" : "Log In"}
          </button>
        </form>

        <p className="mt-4 text-center text-gray-400">
          {isRegister ? "Already have an account?" : "No account yet?"}{" "}
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-white hover:underline"
          >
            {isRegister ? "Log In" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
}
