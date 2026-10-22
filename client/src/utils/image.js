import { AVATAR_MAX_BYTES } from "./profileOptions";

const OK_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_INPUT_BYTES = 10 * 1024 * 1024;
const SIZE = 320; // pixels per side
const TARGET = AVATAR_MAX_BYTES - 10 * 1024; // stay clearly under the server limit

const load = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("unreadable"));
    };
    img.src = url;
  });

const toBlob = (canvas, quality) =>
  new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));

/** Centre-crops to a square, scales to 320 px and returns a JPEG blob small enough for the server. Throws a readable Error. */
export async function resizeAvatar(file) {
  if (!OK_TYPES.includes(file.type))
    throw new Error("Choose a JPEG, PNG or WebP image.");
  if (file.size > MAX_INPUT_BYTES)
    throw new Error("That image is too large. Choose one under 10 MB.");
  let img;
  try {
    img = await load(file);
  } catch {
    throw new Error("We couldn’t read that image. Try a different one.");
  }
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  if (!side)
    throw new Error("We couldn’t read that image. Try a different one.");

  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff"; // JPEG has no transparency
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.drawImage(
    img,
    (img.naturalWidth - side) / 2,
    (img.naturalHeight - side) / 2,
    side,
    side,
    0,
    0,
    SIZE,
    SIZE,
  );

  for (const quality of [0.9, 0.8, 0.7, 0.6, 0.5]) {
    // eslint-disable-next-line no-await-in-loop
    const blob = await toBlob(canvas, quality);
    if (blob && blob.size <= TARGET) return blob;
  }
  throw new Error(
    "We couldn’t make that image small enough. Try a simpler photo.",
  );
}
