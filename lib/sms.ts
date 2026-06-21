/**
 * Driver SMS notification module.
 * Currently STUBBED — logs to console.
 * Activate by setting TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
 * TWILIO_FROM_NUMBER, and DRIVER_PHONE_NUMBERS env vars.
 */

interface JobDetails {
  orderId: string;
  address: string;
  jobType: string;
  size: string;
  price: number;
}

export async function notifyDrivers(job: JobDetails): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  const driverNumbers = process.env.DRIVER_PHONE_NUMBERS?.split(",") ?? [];

  const message =
    `🚨 New SnowNoMore Job!\n` +
    `Order: ${job.orderId}\n` +
    `Address: ${job.address}\n` +
    `Job: ${job.jobType} (${job.size})\n` +
    `Pay: $${job.price}\n` +
    `Accept at: ${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`;

  if (!sid || !token || !fromNumber || driverNumbers.length === 0) {
    // STUB MODE — Twilio not configured yet
    console.log("=== [SMS STUB] Driver notification ===");
    console.log(message);
    console.log("=====================================");
    return;
  }

  // REAL TWILIO MODE — activates when env vars are set
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  try {
    // Dynamic require so missing twilio package doesn't break the build
    // Install with: npm install twilio
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const twilioLib = require("twilio") as any;
    const twilioFn = twilioLib.default ?? twilioLib;
    const client = twilioFn(sid, token);
    await Promise.all(
      driverNumbers.map((to) =>
        client.messages.create({ body: message, from: fromNumber, to: to.trim() })
      )
    );
    console.log(`[SMS] Notified ${driverNumbers.length} driver(s) for order ${job.orderId}`);
  } catch (err) {
    console.error("[SMS] Twilio send failed:", err);
  }
}
