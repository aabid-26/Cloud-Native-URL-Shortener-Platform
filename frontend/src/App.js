import { useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { QRCodeSVG } from "qrcode.react";

const API = "";

export default function App() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  const shorten = async () => {
    if (!url.trim()) return toast.error("Please enter a URL");
    if (!url.startsWith("http://") && !url.startsWith("https://"))
      return toast.error("URL must start with http:// or https://");

    setLoading(true);
    setResult(null);
    setStats(null);
    setShowQR(false);
    setCopied(false);

    try {
      const res = await axios.post(`${API}/api/shorten`, { url });
      setResult(res.data);
      const statsRes = await axios.get(
        `${API}/api/stats/${res.data.short_code}`
      );
      setStats(statsRes.data);
      toast.success("Short URL created!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(result.short_url);
    setCopied(true);
    toast.success("Copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0a0a0a 0%, #0d1a0d 50%, #0a0a0a 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
        fontFamily: "'Inter', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow orbs */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "600px",
          background:
            "radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          right: "10%",
          width: "300px",
          height: "300px",
          background:
            "radial-gradient(circle, rgba(34,197,94,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "rgba(20,20,20,0.95)",
            color: "#4ade80",
            border: "1px solid rgba(34,197,94,0.3)",
            backdropFilter: "blur(12px)",
          },
        }}
      />

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(34,197,94,0.25)",
            borderRadius: "50px",
            padding: "8px 20px",
            marginBottom: "1.25rem",
            backdropFilter: "blur(12px)",
          }}
        >
          <span style={{ fontSize: "20px" }}>🔗</span>
          <span
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "#4ade80",
              letterSpacing: "0.5px",
            }}
          >
            Snip.ly
          </span>
        </div>
        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: 700,
            color: "#ffffff",
            margin: "0 0 0.5rem",
            lineHeight: 1.2,
          }}
        >
          Shorten. Share. <span style={{ color: "#4ade80" }}>Done.</span>
        </h1>
        <p
          style={{
            color: "rgba(255,255,255,0.4)",
            fontSize: "15px",
            margin: 0,
          }}
        >
          Paste a long URL and get a short one instantly
        </p>
      </div>

      {/* Input card */}
      <div
        style={{
          width: "100%",
          maxWidth: "580px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(34,197,94,0.2)",
          borderRadius: "20px",
          padding: "1.5rem",
          marginBottom: "1rem",
          backdropFilter: "blur(20px)",
          boxShadow:
            "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        <label
          style={{
            fontSize: "11px",
            color: "rgba(255,255,255,0.4)",
            display: "block",
            marginBottom: "8px",
            letterSpacing: "1px",
            textTransform: "uppercase",
          }}
        >
          Your long URL
        </label>
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            placeholder="https://example.com/very/long/url..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && shorten()}
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(34,197,94,0.2)",
              borderRadius: "12px",
              padding: "12px 16px",
              fontSize: "14px",
              color: "#ffffff",
              outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) =>
              (e.target.style.borderColor = "rgba(34,197,94,0.6)")
            }
            onBlur={(e) => (e.target.style.borderColor = "rgba(34,197,94,0.2)")}
          />
          <button
            onClick={shorten}
            disabled={loading}
            style={{
              background: loading
                ? "rgba(34,197,94,0.3)"
                : "linear-gradient(135deg, #16a34a, #4ade80)",
              border: "none",
              borderRadius: "12px",
              padding: "12px 24px",
              fontSize: "14px",
              fontWeight: 600,
              color: loading ? "rgba(255,255,255,0.5)" : "#000000",
              cursor: loading ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s",
              boxShadow: loading ? "none" : "0 0 20px rgba(34,197,94,0.3)",
            }}
          >
            {loading ? "..." : "Shorten →"}
          </button>
        </div>
      </div>

      {/* Result card */}
      {result && (
        <div
          style={{
            width: "100%",
            maxWidth: "580px",
            background: "rgba(34,197,94,0.05)",
            border: "1px solid rgba(34,197,94,0.35)",
            borderRadius: "20px",
            padding: "1.5rem",
            marginBottom: "1rem",
            backdropFilter: "blur(20px)",
            boxShadow:
              "0 8px 32px rgba(0,0,0,0.4), 0 0 40px rgba(34,197,94,0.05)",
            animation: "fadeIn 0.3s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                color: "rgba(255,255,255,0.4)",
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              Your short URL
            </span>
            <span
              style={{
                fontSize: "11px",
                padding: "3px 10px",
                borderRadius: "50px",
                background: "rgba(34,197,94,0.15)",
                color: "#4ade80",
                border: "1px solid rgba(34,197,94,0.3)",
              }}
            >
              ● Live
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "16px",
            }}
          >
            <span
              style={{
                flex: 1,
                fontSize: "18px",
                fontWeight: 600,
                color: "#4ade80",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {result.short_url}
            </span>
            <button
              onClick={copy}
              style={{
                background: copied
                  ? "rgba(34,197,94,0.2)"
                  : "rgba(255,255,255,0.05)",
                border: "1px solid rgba(34,197,94,0.3)",
                borderRadius: "10px",
                padding: "8px 14px",
                fontSize: "12px",
                color: copied ? "#4ade80" : "rgba(255,255,255,0.6)",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s",
              }}
            >
              {copied ? "✓ Copied" : "Copy"}
            </button>
            <button
              onClick={() => setShowQR(!showQR)}
              style={{
                background: showQR
                  ? "rgba(34,197,94,0.2)"
                  : "rgba(255,255,255,0.05)",
                border: "1px solid rgba(34,197,94,0.3)",
                borderRadius: "10px",
                padding: "8px 14px",
                fontSize: "12px",
                color: showQR ? "#4ade80" : "rgba(255,255,255,0.6)",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s",
              }}
            >
              {showQR ? "Hide QR" : "QR Code"}
            </button>
          </div>

          {showQR && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "1.25rem",
                borderTop: "1px solid rgba(34,197,94,0.15)",
                borderBottom: "1px solid rgba(34,197,94,0.15)",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  background: "#ffffff",
                  padding: "12px",
                  borderRadius: "12px",
                  boxShadow: "0 0 30px rgba(34,197,94,0.2)",
                }}
              >
                <QRCodeSVG value={result.short_url} size={140} />
              </div>
            </div>
          )}

          <div
            style={{
              fontSize: "12px",
              color: "rgba(255,255,255,0.3)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              paddingTop: "4px",
            }}
          >
            ↳ {result.original_url}
          </div>
        </div>
      )}

      {/* Stats card */}
      {stats && (
        <div
          style={{
            width: "100%",
            maxWidth: "580px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "20px",
            padding: "1.25rem 1.5rem",
            backdropFilter: "blur(20px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          <p
            style={{
              fontSize: "11px",
              color: "rgba(255,255,255,0.4)",
              margin: "0 0 12px",
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            Analytics
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "10px",
            }}
          >
            {[
              { label: "Clicks", value: stats.clicks },
              {
                label: "Created",
                value: new Date(stats.created_at).toLocaleDateString(),
              },
              { label: "Code", value: stats.short_code },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "14px",
                  padding: "14px",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.3)",
                    margin: "0 0 6px",
                    letterSpacing: "0.5px",
                  }}
                >
                  {label}
                </p>
                <p
                  style={{
                    fontSize: label === "Clicks" ? "26px" : "14px",
                    fontWeight: 600,
                    color: "#ffffff",
                    margin: 0,
                    fontFamily: label === "Code" ? "monospace" : "inherit",
                  }}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <p
        style={{
          fontSize: "12px",
          color: "rgba(255,255,255,0.15)",
          marginTop: "2rem",
        }}
      >
        Built with Ballerina · React · PostgreSQL · Docker · Kubernetes
      </p>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: rgba(255,255,255,0.2); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
