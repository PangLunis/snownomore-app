import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getOrderBySessionId, updateOrderStatus } from "@/lib/db";
import { notifyDrivers } from "@/lib/sms";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-05-27.dahlia",
});

// Stripe sends raw body; Next.js App Router gives us a ReadableStream
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  if (webhookSecret) {
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err) {
      console.error("[webhook] signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  } else {
    // No webhook secret configured — parse raw (dev/local only)
    console.warn("[webhook] STRIPE_WEBHOOK_SECRET not set — skipping verification (dev mode)");
    event = JSON.parse(rawBody) as Stripe.Event;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { address, jobType, size, price, orderId } = session.metadata ?? {};

    console.log(`[webhook] Payment confirmed for session ${session.id}`);

    // Find order and mark as pending (payment confirmed, awaiting driver)
    const order = getOrderBySessionId(session.id);
    if (order) {
      updateOrderStatus(order.id, "pending");
    }

    // Notify drivers via SMS (stubbed until Twilio is configured)
    await notifyDrivers({
      orderId: orderId ?? session.id,
      address: address ?? "unknown",
      jobType: jobType ?? "unknown",
      size: size ?? "unknown",
      price: Number(price ?? 0),
    });
  }

  return NextResponse.json({ received: true });
}
