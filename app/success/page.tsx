"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface Order {
  id: string;
  address: string;
  jobType: string;
  size: string;
  price: number;
  status: string;
}

function SuccessContent() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }
    // Poll for order (webhook might not have fired yet)
    let attempts = 0;
    const poll = async () => {
      try {
        const res = await fetch("/api/orders");
        const orders: Order[] = await res.json();
        const found = orders.find(
          (o: Order & { stripeSessionId?: string }) =>
            (o as Order & { stripeSessionId: string }).stripeSessionId === sessionId
        );
        if (found) {
          setOrder(found);
          setLoading(false);
          return;
        }
      } catch {/* ignore */}
      attempts++;
      if (attempts < 8) setTimeout(poll, 1000);
      else setLoading(false);
    };
    poll();
  }, [sessionId]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-950 to-blue-900 text-white flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur rounded-2xl p-8 shadow-xl border border-white/20 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold mb-2">Payment Confirmed!</h1>
          <p className="text-blue-300 mb-6">
            We&apos;ll text you as soon as a driver accepts your job.
          </p>

          {loading ? (
            <div className="bg-white/5 rounded-xl p-4 text-blue-300 text-sm">
              Loading order details…
            </div>
          ) : order ? (
            <div className="bg-blue-500/20 border border-blue-400/40 rounded-xl p-4 text-left mb-6">
              <div className="text-xs text-blue-400 font-mono mb-2">
                Order ID: {order.id.slice(0, 8).toUpperCase()}
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-300">Address</span>
                  <span className="font-medium text-right max-w-[60%]">{order.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-300">Job</span>
                  <span className="font-medium capitalize">{order.jobType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-300">Size</span>
                  <span className="font-medium capitalize">{order.size}</span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-2 mt-2">
                  <span className="text-blue-300">Total Paid</span>
                  <span className="font-bold text-lg">${order.price}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/5 rounded-xl p-4 text-blue-300 text-sm mb-6">
              Your order is being processed. You&apos;ll receive a confirmation shortly.
            </div>
          )}

          <div className="space-y-3">
            <Link
              href="/"
              className="block w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-400 font-semibold transition-all text-center"
            >
              Book Another Job
            </Link>
            <Link
              href="/dashboard"
              className="block w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 font-medium transition-all text-center text-sm"
            >
              View Driver Dashboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-b from-blue-950 to-blue-900 text-white flex items-center justify-center">
        <div className="text-blue-300">Loading…</div>
      </main>
    }>
      <SuccessContent />
    </Suspense>
  );
}
