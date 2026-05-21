import { useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { QRCodeSVG } from "qrcode.react";

const API = "http://localhost:8080";

export default function App() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const shorten = async () => {
    if (!url.trim()) return toast.error("Please enter a URL");
    if (!url.startsWith("http://") && !url.startsWith("https://"))
      return toast.error("URL must start with http:// or https://");

    setLoading(true);
    setResult(null);
    setStats(null);
    setShowQR(false);

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
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 mb-3 shadow-sm">
          <span className="text-2xl">🔗</span>
          <span className="text-lg font-semibold text-gray-800">Snip.ly</span>
        </div>
        <p className="text-gray-500 text-sm">
          Paste a long URL and get a short one instantly
        </p>
      </div>

      {/* Input card */}
      <div className="w-full max-w-xl bg-white border border-gray-200 rounded-2xl p-5 shadow-sm mb-4">
        <label className="text-xs text-gray-500 mb-2 block">
          Your long URL
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400 transition"
            placeholder="https://example.com/very/long/url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && shorten()}
          />
          <button
            onClick={shorten}
            disabled={loading}
            className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium px-5 py-2 rounded-lg transition disabled:opacity-50"
          >
            {loading ? "..." : "Shorten"}
          </button>
        </div>
      </div>

      {/* Result card */}
      {result && (
        <div className="w-full max-w-xl bg-white border border-emerald-300 rounded-2xl p-5 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500">Your short URL</span>
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md">
              Ready
            </span>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <span className="flex-1 text-emerald-600 font-semibold text-sm truncate">
              {result.short_url}
            </span>
            <button
              onClick={copy}
              className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition flex items-center gap-1"
            >
              📋 Copy
            </button>
            <button
              onClick={() => setShowQR(!showQR)}
              className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition flex items-center gap-1"
            >
              {showQR ? "Hide QR" : "🔲 QR"}
            </button>
          </div>

          {showQR && (
            <div className="flex justify-center py-3 border-t border-gray-100">
              <QRCodeSVG value={result.short_url} size={140} />
            </div>
          )}

          <div className="text-xs text-gray-400 truncate border-t border-gray-100 pt-3">
            → {result.original_url}
          </div>
        </div>
      )}

      {/* Stats card */}
      {stats && (
        <div className="w-full max-w-xl bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 mb-3">Analytics</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Clicks</p>
              <p className="text-2xl font-semibold text-gray-800">
                {stats.clicks}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Created</p>
              <p className="text-sm font-medium text-gray-800">
                {new Date(stats.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Code</p>
              <p className="text-sm font-mono font-semibold text-gray-800">
                {stats.short_code}
              </p>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-8">
        Built with Ballerina · React · PostgreSQL
      </p>
    </div>
  );
}
