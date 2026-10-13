import { type NextRequest, NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin-api";
import { getCloudinary } from "@/lib/cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

const MAX_FILE_SIZE = 15 * 1024 * 1024;

const ALLOWED_FOLDERS = new Set([
  "kleidin/products",
  "kleidin/hero",
  "kleidin/uploads",
]);

type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
  width?: number;
  height?: number;
};

export async function POST(request: NextRequest) {
  const denied = await requireAdminRequest(request, "uploads.create");
  if (denied) return denied;

  // Reject oversized requests before materializing multipart data in memory.
  // Allow a small overhead for multipart boundaries and form fields.
  const declaredSize = Number(request.headers.get("content-length"));
  if (
    request.headers.has("content-length") &&
    Number.isFinite(declaredSize) &&
    declaredSize > MAX_FILE_SIZE + 1024 * 1024
  ) {
    return NextResponse.json({ error: "Image must be 15 MB or smaller." }, { status: 413 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const requestedFolder = String(
      formData.get("folder") || "kleidin/uploads",
    ).trim();

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Image file is required." },
        { status: 400 },
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPG, PNG, WEBP, and AVIF images are allowed." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Image must be 15 MB or smaller." },
        { status: 400 },
      );
    }

    const folder = ALLOWED_FOLDERS.has(requestedFolder)
      ? requestedFolder
      : "kleidin/uploads";

    const buffer = Buffer.from(await file.arrayBuffer());
    const cloudinary = getCloudinary();

    const uploaded = await new Promise<CloudinaryUploadResult>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: "image",
            ...(folder === "kleidin/hero"
              ? {
                  transformation: [
                    {
                      width: 1920,
                      height: 1920,
                      crop: "limit",
                      quality: "auto:good",
                      fetch_format: "auto",
                    },
                  ],
                }
              : {}),
          },
          (error, result) => {
            if (error) {
              reject(error);
              return;
            }

            if (!result?.secure_url || !result.public_id) {
              reject(new Error("Cloudinary returned no upload result."));
              return;
            }

            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id,
              width: result.width,
              height: result.height,
            });
          },
        );

        stream.end(buffer);
      },
    );

    return NextResponse.json({
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
      width: uploaded.width,
      height: uploaded.height,
    });
  } catch (error) {
    // Provider details and secret configuration never belong in a public JSON response.
    console.error("KLEID.IN image upload failed:", error instanceof Error ? error.name : "unknown");
    return NextResponse.json(
      { error: "Image upload failed. Check the image service and try again." },
      { status: 502 },
    );
  }
}
