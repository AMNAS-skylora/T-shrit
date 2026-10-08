import "server-only";

import { v2 as cloudinary } from "cloudinary";
import { requireCloudinaryEnvironment } from "@/lib/server-env";

let configured = false;

export function getCloudinary() {
  if (!configured) {
    const env = requireCloudinaryEnvironment();

    cloudinary.config({
      cloud_name: env.cloudName,
      api_key: env.apiKey,
      api_secret: env.apiSecret,
      secure: true,
    });

    configured = true;
  }

  return cloudinary;
}
