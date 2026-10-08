export const publicEnv = {
  phoneNumber: process.env.NEXT_PUBLIC_PHONE_NUMBER?.trim() ?? "",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() ?? "",
  supportEmail:
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "",
  instagramUrl: process.env.NEXT_PUBLIC_INSTAGRAM_URL?.trim() ?? "",
  facebookUrl: process.env.NEXT_PUBLIC_FACEBOOK_URL?.trim() ?? "",
} as const;
