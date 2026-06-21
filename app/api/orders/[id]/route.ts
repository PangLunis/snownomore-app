import { NextRequest, NextResponse } from "next/server";
import { updateOrderStatus, type OrderStatus } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { status } = body as { status: OrderStatus };

  const validStatuses: OrderStatus[] = ["pending", "accepted", "in-progress", "complete"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = updateOrderStatus(id, status);
  if (!updated) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
