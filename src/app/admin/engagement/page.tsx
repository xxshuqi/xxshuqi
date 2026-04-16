"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface CommentRow {
  id: string;
  author: string;
  body: string;
  createdAt: string;
  photo: {
    id: string;
    thumbUrl: string;
    caption: string | null;
  };
}

interface LikeRow {
  id: string;
  thumbUrl: string;
  caption: string | null;
  originalUrl: string;
  likeCount: number;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function EngagementPage() {
  const [tab, setTab] = useState<"comments" | "likes">("comments");
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [likes, setLikes] = useState<LikeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/engagement/comments").then((r) => r.json()),
      fetch("/api/engagement/likes").then((r) => r.json()),
    ]).then(([c, l]) => {
      setComments(Array.isArray(c) ? c : []);
      setLikes(Array.isArray(l) ? l : []);
      setLoading(false);
    });
  }, []);

  const deleteComment = async (id: string) => {
    if (!confirm("Delete this comment?")) return;
    setDeleting(id);
    await fetch(`/api/comments/${id}`, { method: "DELETE" });
    setComments((prev) => prev.filter((c) => c.id !== id));
    setDeleting(null);
  };

  const totalLikes = likes.reduce((sum, p) => sum + p.likeCount, 0);
  const totalComments = comments.length;

  return (
    <div>
      <h1 style={{ fontSize: "28px", fontWeight: 400, marginBottom: "4px", fontFamily: "Libre Caslon Display, Georgia, serif" }}>
        Engagement
      </h1>
      <p style={{ color: "#999", fontSize: "13px", marginBottom: "32px" }}>
        {totalLikes} likes · {totalComments} comments
      </p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0", borderBottom: "1px solid #e8e8e8", marginBottom: "32px" }}>
        {(["comments", "likes"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: "none",
              border: "none",
              borderBottom: tab === t ? "2px solid #111" : "2px solid transparent",
              padding: "10px 20px",
              fontSize: "13px",
              color: tab === t ? "#111" : "#999",
              cursor: "pointer",
              textTransform: "capitalize",
              marginBottom: "-1px",
              fontFamily: "DM Sans, system-ui, sans-serif",
            }}
          >
            {t === "comments" ? `Comments (${totalComments})` : `Likes (${totalLikes})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: "#999", fontSize: "13px" }}>Loading…</div>
      ) : tab === "comments" ? (
        comments.length === 0 ? (
          <p style={{ color: "#bbb", fontSize: "13px" }}>No comments yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#e8e8e8", border: "1px solid #e8e8e8", borderRadius: "6px", overflow: "hidden" }}>
            {comments.map((c) => (
              <div
                key={c.id}
                style={{ display: "flex", alignItems: "flex-start", gap: "16px", background: "#fff", padding: "14px 16px" }}
              >
                {/* Photo thumbnail */}
                <div style={{ flexShrink: 0, width: "48px", height: "48px", position: "relative", background: "linear-gradient(135deg, #c5d8e3, #7a9aad)", borderRadius: "4px", overflow: "hidden" }}>
                  <Image src={c.photo.thumbUrl} alt="" fill sizes="48px" style={{ objectFit: "cover" }} />
                </div>

                {/* Comment content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "3px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 500, color: "#111" }}>{c.author}</span>
                    <span style={{ fontSize: "11px", color: "#bbb" }}>{timeAgo(c.createdAt)}</span>
                    {c.photo.caption && (
                      <span style={{ fontSize: "11px", color: "#bbb" }}>on "{c.photo.caption}"</span>
                    )}
                  </div>
                  <p style={{ fontSize: "13px", color: "#555", fontWeight: 300, lineHeight: 1.5, margin: 0 }}>{c.body}</p>
                </div>

                {/* Delete */}
                <button
                  onClick={() => deleteComment(c.id)}
                  disabled={deleting === c.id}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "#ccc", fontSize: "16px", padding: "0 4px", flexShrink: 0,
                    transition: "color 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#c00")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#ccc")}
                  title="Delete comment"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        likes.length === 0 ? (
          <p style={{ color: "#bbb", fontSize: "13px" }}>No likes yet.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "16px" }}>
            {likes.map((p) => (
              <div key={p.id} style={{ border: "1px solid #e8e8e8", borderRadius: "6px", overflow: "hidden" }}>
                <div style={{ position: "relative", aspectRatio: `${p.likeCount > 0 ? "1" : "1"}`, background: "linear-gradient(135deg, #c5d8e3, #7a9aad)" }}>
                  <Image src={p.thumbUrl} alt={p.caption ?? ""} fill sizes="160px" style={{ objectFit: "cover" }} />
                  <div style={{ position: "absolute", top: "8px", right: "8px", background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: "12px", padding: "3px 8px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <span>♥</span>
                    <span>{p.likeCount}</span>
                  </div>
                </div>
                {p.caption && (
                  <div style={{ padding: "8px 10px", fontSize: "11px", color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
