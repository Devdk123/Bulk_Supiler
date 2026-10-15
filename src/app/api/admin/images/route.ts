import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const imageTypes = new Map([
  ["image/jpeg", { extension: "jpg", signature: (bytes: Uint8Array) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff }],
  ["image/png", { extension: "png", signature: (bytes: Uint8Array) => bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 }],
  ["image/webp", { extension: "webp", signature: (bytes: Uint8Array) =>
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP" }]
]);

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_FILE_SIZE + 32_000) {
    return NextResponse.json({ error: "Image exceeds the 5 MB upload limit." }, { status: 413 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid image upload." }, { status: 400 });
  }

  const file = form.get("file");
  const requestedFolder = form.get("folder");
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Choose a non-empty image up to 5 MB." }, { status: 400 });
  }

  const type = imageTypes.get(file.type);
  if (!type) {
    return NextResponse.json({ error: "Only JPEG, PNG and WebP images are accepted." }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!type.signature(bytes)) {
    return NextResponse.json({ error: "The file content does not match its image type." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const folder = requestedFolder === "brands" ? "brands" : "products";
    const objectPath = `${folder}/${randomUUID()}.${type.extension}`;
    const { error } = await supabase.storage.from("product-images").upload(objectPath, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false
    });

    if (error) {
      console.error("Product image upload failed:", error.message);
      return NextResponse.json({ error: "Unable to upload image. Check that the database migration and image bucket are configured." }, { status: 503 });
    }

    const { data } = supabase.storage.from("product-images").getPublicUrl(objectPath);
    return NextResponse.json({ image_url: data.publicUrl }, { status: 201 });
  } catch (error) {
    console.error("Product image upload failed:", error);
    return NextResponse.json({ error: "Unable to upload image." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid image request." }, { status: 400 }); }
  if (!body || typeof body !== "object" || !("image_url" in body) || typeof body.image_url !== "string") {
    return NextResponse.json({ error: "A product image URL is required." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
    const image = new URL(body.image_url);
    const base = new URL(supabaseUrl);
    const prefix = "/storage/v1/object/public/product-images/";
    if (image.origin !== base.origin || !image.pathname.startsWith(prefix)) {
      return NextResponse.json({ error: "Only images uploaded to this product bucket can be deleted." }, { status: 400 });
    }

    const objectPath = decodeURIComponent(image.pathname.slice(prefix.length));
    if (!["products/", "brands/"].some((folder) => objectPath.startsWith(folder)) || objectPath.includes("..")) {
      return NextResponse.json({ error: "Invalid product image path." }, { status: 400 });
    }
    const { error } = await supabase.storage.from("product-images").remove([objectPath]);
    if (error) {
      console.error("Product image removal failed:", error.message);
      return NextResponse.json({ error: "Unable to remove image." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Product image removal failed:", error);
    return NextResponse.json({ error: "Unable to remove image." }, { status: 400 });
  }
}
