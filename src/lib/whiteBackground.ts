// Product photos look best on a clean white square, like the big marketplaces.
// The background is removed in the browser (the model downloads once and is then cached),
// so this only ever runs in the admin while uploading.

const MAX_SIZE = 1600; // px, longest side of the finished square
const PADDING = 0.08; // white space around the product, as a share of the square

export async function toWhiteBackground(file: File): Promise<File> {
  const { removeBackground } = await import("@imgly/background-removal");
  const cutout = await removeBackground(file, { model: "isnet_fp16", output: { format: "image/png" } });
  const img = await createImageBitmap(cutout);

  // Crop to the product itself so every photo gets the same margins
  const box = opaqueBounds(img) ?? { x: 0, y: 0, w: img.width, h: img.height };
  const side = Math.min(MAX_SIZE, Math.round(Math.max(box.w, box.h) / (1 - PADDING * 2)));
  const scale = (side * (1 - PADDING * 2)) / Math.max(box.w, box.h);
  const w = box.w * scale;
  const h = box.h * scale;

  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = side;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, side, side);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, box.x, box.y, box.w, box.h, (side - w) / 2, (side - h) / 2, w, h);
  img.close();

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not create the image"))), "image/jpeg", 0.92)
  );
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + "-white.jpg", { type: "image/jpeg" });
}

/** Bounding box of the pixels that are not (almost) transparent. */
function opaqueBounds(img: ImageBitmap) {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const { data } = ctx.getImageData(0, 0, img.width, img.height);

  let minX = img.width, minY = img.height, maxX = -1, maxY = -1;
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      if (data[(y * img.width + x) * 4 + 3] > 128) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}
