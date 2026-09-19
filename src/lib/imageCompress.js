// Client-side downscale + recompress for admin image uploads. Runs entirely
// in the browser (Canvas API, no dependency) before the file ever reaches
// Supabase Storage — the actual fix for "why is a phone photo 7MB", applied
// once here instead of trusting every future upload to already be sized
// right. Always falls back to the original file on any failure or if the
// result isn't actually smaller, so a broken/unsupported browser API never
// blocks an admin from saving a product.
const MAX_DIMENSION = 1600; // long edge — comfortably covers the largest real display size in the app (the sticky product photo)
const QUALITY = 0.82;

export async function compressImage(file) {
  if (!file || !file.type || !file.type.startsWith("image/") || file.type === "image/svg+xml") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0, width, height);
    if (bitmap.close) bitmap.close();

    const supportsWebp = canvas.toDataURL("image/webp").startsWith("data:image/webp");
    const type = supportsWebp ? "image/webp" : "image/jpeg";
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, QUALITY));
    if (!blob || blob.size >= file.size) return file;

    const ext = type === "image/webp" ? "webp" : "jpg";
    const name = file.name.replace(/\.[^.]+$/, "") + "." + ext;
    return new File([blob], name, { type });
  } catch {
    return file;
  }
}
