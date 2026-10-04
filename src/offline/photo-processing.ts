export const MAX_PHOTO_BYTES = 1_572_864;
export async function processPhoto(file: File, maxEdge = 1600): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("INVALID_PHOTO");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas"); canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
  const encode = (quality: number) => new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("PHOTO_ENCODING_FAILED")), "image/webp", quality));
  let blob = await encode(.82);
  if (blob.size > MAX_PHOTO_BYTES) blob = await encode(.62);
  if (blob.size > MAX_PHOTO_BYTES) throw new Error("PHOTO_TOO_LARGE");
  return blob;
}
