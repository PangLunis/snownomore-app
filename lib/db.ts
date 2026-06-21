/**
 * Simple file-based JSON store for orders.
 * TODO: Replace with Supabase or Vercel Postgres before go-live.
 */
import fs from "fs";
import path from "path";

export type OrderStatus =
  | "pending"
  | "accepted"
  | "in-progress"
  | "complete";

export interface Order {
  id: string;
  address: string;
  jobType: "driveway" | "walkway" | "car";
  size: "small" | "medium" | "large";
  price: number;
  status: OrderStatus;
  stripeSessionId: string;
  createdAt: string;
}

// On Vercel, process.cwd() is read-only. Use /tmp for writable storage.
// Note: /tmp is ephemeral on Vercel — orders persist per-instance only.
// TODO: Replace with Supabase/Vercel Postgres for production persistence.
const DB_PATH =
  process.env.VERCEL
    ? "/tmp/orders.json"
    : path.join(process.cwd(), "data", "orders.json");

function ensureDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify([]));
}

export function getAllOrders(): Order[] {
  ensureDb();
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw) as Order[];
}

export function getOrderBySessionId(sessionId: string): Order | undefined {
  return getAllOrders().find((o) => o.stripeSessionId === sessionId);
}

export function getOrderById(id: string): Order | undefined {
  return getAllOrders().find((o) => o.id === id);
}

export function createOrder(order: Order): Order {
  ensureDb();
  const orders = getAllOrders();
  orders.push(order);
  fs.writeFileSync(DB_PATH, JSON.stringify(orders, null, 2));
  return order;
}

export function updateOrderStatus(id: string, status: OrderStatus): Order | null {
  ensureDb();
  const orders = getAllOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  orders[idx].status = status;
  fs.writeFileSync(DB_PATH, JSON.stringify(orders, null, 2));
  return orders[idx];
}
