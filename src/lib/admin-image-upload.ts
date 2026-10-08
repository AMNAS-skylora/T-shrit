"use client";

type UploadFolder =
  | "kleidin/products"
  | "kleidin/hero"
  | "kleidin/uploads";

type UploadResponse = {
  url?: string;
  publicId?: string;
  width?: number;
  height?: number;
  error?: string;
};

export async function uploadAdminImage(
  file: File,
  folder: UploadFolder = "kleidin/products",
) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose a valid image file.");
  }

  if (file.size > 15 * 1024 * 1024) {
    throw new Error("Image must be 15 MB or smaller.");
  }

  const body = new FormData();
  body.set("file", file);
  body.set("folder", folder);

  const response = await fetch("/api/admin/uploads", {
    method: "POST",
    body,
  });

  const data = (await response.json()) as UploadResponse;

  if (!response.ok || !data.url) {
    throw new Error(data.error || "Image upload failed.");
  }

  return {
    url: data.url,
    publicId: data.publicId,
    width: data.width,
    height: data.height,
  };
}
