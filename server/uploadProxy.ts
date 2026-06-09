import { Express, Request, Response } from "express";
import multer from "multer";
import FormData from "form-data";
import { getConfigValue, CONFIG_KEYS } from "./configDb";

// Store uploads in memory (files are forwarded immediately to Pinata)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
});

export function registerUploadProxy(app: Express): void {
  /**
   * POST /api/upload
   * Accepts a multipart/form-data request with a single "file" field.
   * Proxies the file to Pinata's public IPFS endpoint and returns the CID + media URL.
   *
   * Key resolution order:
   *   1. X-IPFS-Storage-Key request header  (per-user key entered in browser)
   *   2. Global DB / env key                (site-wide key set in Settings)
   *
   * The key is kept strictly server-side and never exposed to the browser.
   */
  app.post(
    "/api/upload",
    upload.single("file"),
    async (req: Request, res: Response) => {
      try {
        // Prefer the per-request user-supplied key (header), fall back to global key
        const perRequestKey =
          typeof req.headers["x-ipfs-storage-key"] === "string"
            ? req.headers["x-ipfs-storage-key"].trim()
            : "";
        const globalKey = await getConfigValue(CONFIG_KEYS.NFT_STORAGE_API_KEY);
        const apiKey = perRequestKey || globalKey;

        if (!apiKey) {
          res.status(503).json({
            error:
              "IPFS storage API key is not configured. Please add your Pinata JWT on the Upload page or visit Settings.",
          });
          return;
        }

        if (!req.file) {
          res.status(400).json({ error: "No file provided." });
          return;
        }

        const { buffer, mimetype, originalname } = req.file;

        // Build a multipart/form-data body for Pinata
        const form = new FormData();
        form.append("file", buffer, {
          filename: originalname || "upload",
          contentType: mimetype || "application/octet-stream",
        });
        // Upload to the public IPFS network so the CID is openly accessible
        form.append("network", "public");

        // POST to Pinata v3 upload endpoint
        const pinataRes = await fetch("https://uploads.pinata.cloud/v3/files", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            ...form.getHeaders(),
          },
          body: form.getBuffer() as unknown as BodyInit,
        });

        if (!pinataRes.ok) {
          const errText = await pinataRes.text();
          console.error("[upload-proxy] Pinata error:", errText);
          res.status(502).json({
            error: "IPFS upload failed. Check that your Pinata JWT is valid.",
            detail: errText,
          });
          return;
        }

        const data = (await pinataRes.json()) as {
          data?: { cid: string; name: string };
          IpfsHash?: string; // legacy field, just in case
        };

        const cid = data?.data?.cid ?? data?.IpfsHash;

        if (!cid) {
          console.error("[upload-proxy] Unexpected Pinata response:", data);
          res.status(502).json({ error: "IPFS storage returned an unexpected response." });
          return;
        }

        // Use a public IPFS gateway URL
        const mediaUrl = `https://ipfs.io/ipfs/${cid}`;

        res.json({ cid, mediaUrl, filename: originalname });
      } catch (err) {
        console.error("[upload-proxy] Unexpected error:", err);
        res.status(500).json({ error: "Internal server error during upload." });
      }
    }
  );
}
