"use client";

/**
 * SMS is disabled. Free alternative: email and in-app notifications.
 * Kept as a no-op so old call sites do not crash.
 */
export async function sendSMS(_to: string, _message: string) {
  console.info("[notify] SMS disabled. Use email or in-app notifications instead.");
  return { success: true, channel: "email-inapp" as const };
}

export default sendSMS;
