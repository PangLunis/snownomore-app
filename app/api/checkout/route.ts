import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createOrder, getOrderBySessionId } from "@/lib/db";
import { getPrice, JOB_LABELS, SIZE_LABELS, type JobType, type Size } from "@/lib/pricing";
import { randomUUID } from "crypto";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-05-27.dahlia",
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { address, jobType, size } = body as {
      address: string;
      jobType: JobType;
      size: Size;
    };

    if (!address || !jobType || !size) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const price = getPrice(jobType, size);
    if (price === null) {
      return NextResponse.json({ error: "Invalid job type / size combination" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const orderId = randomUUID();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: price * 100, // cents
            product_data: {
              name: `SnowNoMore — ${JOB_LABELS[jobType]}`,
              description: `${jobType !== "car" ? SIZE_LABELS[size] + " · " : ""}${address}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        orderId,
        address,
        jobType,
        size,
        price: String(price),
      },
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/?cancelled=1`,
    });

    // Pre-create the order record (status: pending until webhook confirms)
    createOrder({
      id: orderId,
      address,
      jobType,
      size,
      price,
      status: "pending",
      stripeSessionId: session.id,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error("[checkout] error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
