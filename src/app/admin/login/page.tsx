"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      setError("Incorrect password");
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fafafa",
      }}
    >
      <div style={{ width: "320px" }}>
        <h1
          style={{
            fontFamily: "Libre Caslon Display, Georgia, serif",
            fontSize: "32px",
            fontWeight: 400,
            textAlign: "center",
            marginBottom: "8px",
            color: "#111",
          }}
        >
          Bunnies.
        </h1>
        <p
          style={{
            textAlign: "center",
            fontSize: "12px",
            color: "#999",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: "40px",
          }}
        >
          Admin
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            style={{
              width: "100%",
              padding: "12px 16px",
              border: "1px solid #e8e8e8",
              borderRadius: "6px",
              fontSize: "14px",
              outline: "none",
              marginBottom: "12px",
              fontFamily: "DM Sans, system-ui, sans-serif",
            }}
          />

          {error && (
            <p
              style={{
                color: "#c00",
                fontSize: "13px",
                marginBottom: "12px",
                textAlign: "center",
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              background: "#111",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontSize: "13px",
              letterSpacing: "0.1em",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              fontFamily: "DM Sans, system-ui, sans-serif",
            }}
          >
            {loading ? "..." : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}
