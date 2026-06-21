"use client";

import { useState } from "react";
import {
  JOB_TYPES,
  JOB_LABELS,
  SIZE_LABELS,
  PRICES,
  getPrice,
  getAvailableSizes,
  type JobType,
  type Size,
} from "@/lib/pricing";

export default function HomePage() {
  const [address, setAddress] = useState("");
  const [jobType, setJobType] = useState<JobType>("driveway");
  const [size, setSize] = useState<Size>("small");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const availableSizes = getAvailableSizes(jobType);
  const price = getPrice(jobType, size);

  const handleJobTypeChange = (jt: JobType) => {
    setJobType(jt);
    const sizes = getAvailableSizes(jt);
    if (!sizes.includes(size)) setSize(sizes[0]);
  };

  const handleCheckout = async () => {
    if (!address.trim()) {
      setError("Please enter your address.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: address.trim(), jobType, size }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      window.location.href = data.url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-950 to-blue-900 text-white">
      <header className="px-6 py-6 flex items-center gap-3">
        <span className="text-3xl">❄️</span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SnowNoMore</h1>
          <p className="text-blue-300 text-sm">On-demand snow removal</p>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-6 pb-12">
        <div className="bg-white/10 backdrop-blur rounded-2xl p-6 shadow-xl border border-white/20">
          <h2 className="text-xl font-semibold mb-5">Book a Plow Now</h2>

          <label className="block mb-4">
            <span className="text-sm font-medium text-blue-200 mb-1.5 block">
              Your Address
            </span>
            <input
              type="text"
              placeholder="123 Main St, Boston, MA 02101"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/15 border border-white/30 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
            />
          </label>

          <div className="mb-4">
            <span className="text-sm font-medium text-blue-200 mb-2 block">
              What needs clearing?
            </span>
            <div className="grid grid-cols-3 gap-2">
              {JOB_TYPES.map((jt) => (
                <button
                  key={jt}
                  onClick={() => handleJobTypeChange(jt)}
                  className={`py-3 px-2 rounded-xl text-sm font-medium transition-all border ${
                    jobType === jt
                      ? "bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/30"
                      : "bg-white/10 border-white/20 text-blue-100 hover:bg-white/20"
                  }`}
                >
                  {jt === "driveway" && "🚗 "}
                  {jt === "walkway" && "🚶 "}
                  {jt === "car" && "🚙 "}
                  {JOB_LABELS[jt].split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          {availableSizes.length > 1 && (
            <div className="mb-4">
              <span className="text-sm font-medium text-blue-200 mb-2 block">
                Size
              </span>
              <div className="grid grid-cols-3 gap-2">
                {availableSizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`py-3 px-2 rounded-xl text-sm font-medium transition-all border ${
                      size === s
                        ? "bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/30"
                        : "bg-white/10 border-white/20 text-blue-100 hover:bg-white/20"
                    }`}
                  >
                    <div>{SIZE_LABELS[s]}</div>
                    <div className="text-xs mt-0.5 opacity-80">
                      ${PRICES[jobType][s]}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="bg-blue-500/20 border border-blue-400/40 rounded-xl p-4 mb-5">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">{JOB_LABELS[jobType]}</div>
                <div className="text-sm text-blue-300">
                  {jobType !== "car" ? SIZE_LABELS[size] : "Standard"}
                  {" · "}Flat rate, no surprises
                </div>
              </div>
              <div className="text-3xl font-bold text-blue-200">
                ${price}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-400/40 text-red-200 text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full py-4 rounded-xl bg-blue-500 hover:bg-blue-400 disabled:opacity-60 font-semibold text-lg transition-all shadow-lg shadow-blue-500/40 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Redirecting to payment…
              </>
            ) : (
              <>Pay ${price} with Stripe</>
            )}
          </button>

          <p className="text-center text-xs text-blue-400 mt-3">
            Secured by Stripe · Test mode active
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6 text-center text-sm text-blue-300">
          <div>
            <div className="text-2xl mb-1">⚡</div>
            <div>Driver dispatched within 1 hour</div>
          </div>
          <div>
            <div className="text-2xl mb-1">💬</div>
            <div>SMS updates throughout</div>
          </div>
          <div>
            <div className="text-2xl mb-1">✅</div>
            <div>Satisfaction guaranteed</div>
          </div>
        </div>

        <div className="text-center mt-6">
          <a href="/dashboard" className="text-blue-400 hover:text-blue-300 text-sm underline">
            Driver Dashboard →
          </a>
        </div>
      </div>
    </main>
  );
}
