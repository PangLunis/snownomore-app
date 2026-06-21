import { NextResponse } from "next/server";
import { getAllOrders } from "@/lib/db";

export async function GET() {
  const orders = getAllOrders();
  // Sort newest first
  orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json(orders);
}
