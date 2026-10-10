/**
 * Shared product constants for SchoolPilot frontend.
 * Keep support contact details in one place so every surface agrees.
 */

/** Single SchoolPilot WhatsApp support number (E.164 without +). */
export const SUPPORT_WHATSAPP_NUMBER = "2348038459232";

export function supportWhatsAppUrl(message = "Hi, I need help with SchoolPilot"): string {
  return `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export const SUPPORT_EMAIL = "hello@schoolpilot.ng";
