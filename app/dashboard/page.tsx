"use client";

import { useEffect, useState, useCallback } from "react";
import { JOB_LABELS, SIZE_LABELS, type JobType, type Size } from "@/lib/pricing";

interface Order {
  id: string;
  address: string;
  jobType: JobType;
  size: Size;
  price: number;
  status: "pending" | "accepted" | "in-progress" | "complete";
  stripeSessionId: string;
  createdAt: string;
}

const STATUS_COLORS: Record<Order["status"], string> = {
  pending: "bg-yellow-500/20 text-yellow-300 border-yellow-400/40",
  accepted: "bg-blue-500/20 text-blue-300 border-blue-400/40",
  "in-progress": "bg-purple-500/20 text-purple-300 border-purple-400/40",
  complete: "bg-green-500/20 text-green-300 border-green-400/40",
};

const NEXT_STATUS: Record<Order["status"], Order["status"] | null> = {
  pending: "accepted",
  accepted: "in-progress",
  "in-progress": "complete",
  complete: null,
};

const STATUS_BUTTON_LABELS: Record<Order["status"], string> = {
  pending: "Accept Job",
  accepted: "Mark In Progress",
  "in-progress": "Mark Complete",
  complete: "Done",
};

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState<Order["status"] | "all">("all");

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const updateStatus = async (order: Order, newStatus: Order["status"]) => {
    setUpdating(order.id);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchOrders();
      }
    } catch (err) {
      console.error("Failed to update order:", err);
    } finally {
      setUpdating(null);
    }
  };

  const filtered =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const counts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    accepted: orders.filter((o) => o.status === "accepted").length,
    "in-progress": orders.filter((o) => o.status === "in-progress").length,
    complete: orders.filter((o) => o.status === "complete").length,
  };

  const totalRevenue = orders
    .filter((o) => o.status !== "pending")
    .reduce((sum, o) => sum + o.price, 0);

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">❄️</span>
          <div>
            <h1 className="text-lg font-bold">SnowNoMore</h1>
            <p className="text-gray-400 text-xs">Driver Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-gray-400">Revenue (accepted+)</div>
            <div className="font-bold text-green-400">${totalRevenue}</div>
          </div>
          <a
            href="/"
            className="text-sm text-blue-400 hover:text-blue-300 border border-blue-400/40 rounded-lg px-3 py-1.5"
          >
            ← Order Page
          </a>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {(["all", "pending", "accepted", "in-progress", "complete"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-xl p-3 border text-center transition-all ${
                filter === s
                  ? "bg-white/15 border-white/30"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
            >
              <div className="text-2xl font-bold">{counts[s]}</div>
              <div className="text-xs text-gray-400 capitalize mt-0.5">{s}</div>
            </button>
          ))}
        </div>

        {/* Orders table */}
        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading orders…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            {filter === "all" ? "No orders yet." : `No ${filter} orders.`}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((order) => {
              const nextStatus = NEXT_STATUS[order.status];
              return (
                <div
                  key={order.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4"
                >
                  {/* Order ID */}
                  <div className="w-20 flex-shrink-0">
                    <div className="text-xs text-gray-500 font-mono">
                      {order.id.slice(0, 8).toUpperCase()}
                    </div>
                  </div>

                  {/* Address + job */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{order.address}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {JOB_LABELS[order.jobType]} ·{" "}
                      {order.jobType !== "car" ? SIZE_LABELS[order.size] : "Standard"}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="w-16 text-right flex-shrink-0">
                    <div className="font-bold">${order.price}</div>
                  </div>

                  {/* Status badge */}
                  <div className="w-28 flex-shrink-0">
                    <span
                      className={`inline-block text-xs px-2 py-1 rounded-full border font-medium capitalize ${STATUS_COLORS[order.status]}`}
                    >
                      {order.status}
                    </span>
                  </div>

                  {/* Created */}
                  <div className="w-24 text-xs text-gray-500 flex-shrink-0">
                    {new Date(order.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>

                  {/* Action button */}
                  <div className="w-36 flex-shrink-0">
                    {nextStatus ? (
                      <button
                        onClick={() => updateStatus(order, nextStatus)}
                        disabled={updating === order.id}
                        className={`w-full py-1.5 rounded-lg text-xs font-medium transition-all ${
                          order.status === "pending"
                            ? "bg-green-500 hover:bg-green-400 text-white"
                            : "bg-blue-500/30 hover:bg-blue-500/50 text-blue-200 border border-blue-400/40"
                        } disabled:opacity-50`}
                      >
                        {updating === order.id ? "…" : STATUS_BUTTON_LABELS[order.status]}
                      </button>
                    ) : (
                      <span className="text-xs text-green-400 font-medium pl-2">✓ Completed</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
