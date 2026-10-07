/**
 * Client-side Neural Background Removal Utility using @imgly/background-removal.
 * Runs in-browser WASM/WebGPU segmentation to produce transparent PNGs.
 */

export async function removeImageBackground(
  bytes: Uint8Array,
  mimeType = "image/png",
  onProgress?: (percent: number) => void
): Promise<string> {
  try {
    // 1. Wrap raw bytes into an image Blob
    const inputBlob = new Blob([bytes as BlobPart], { type: mimeType || "image/png" });

    // 2. Lazily import @imgly/background-removal to keep initial engine bundle lightweight
    const { removeBackground } = await import("@imgly/background-removal");

    // 3. Execute background removal with progress tracking
    const resultBlob = await removeBackground(inputBlob, {
      progress: (_key: string, current: number, total: number) => {
        if (total > 0 && onProgress) {
          const pct = Math.min(100, Math.round((current / total) * 100));
          onProgress(pct);
        }
      },
    });

    // 4. Convert transparent output Blob to Base64 data URL
    return await blobToDataUrl(resultBlob);
  } catch (err) {
    console.error("[LumiVN] Background removal failed:", err);
    throw new Error(err instanceof Error ? err.message : String(err));
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert resulting image blob to data URL"));
      }
    };
    reader.onerror = () => reject(reader.error || new Error("FileReader encountered an error reading image blob"));
    reader.readAsDataURL(blob);
  });
}
