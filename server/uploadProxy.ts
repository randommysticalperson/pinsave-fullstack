import { Express, Request, Response } from "express";
import multer from "multer";
import { getConfigValue, CONFIG_KEYS } from "./configDb";

// Store uploads in memory (files are forwarded immediately to NFT.Storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
});

export function registerUploadProxy(app: Express): void {
  /**
   * POST /api/upload
   * Accepts a multipart/form-data request with a single "file" field.
   * Proxies the file to NFT.Storage and returns the resulting CID and media URL.
   * The NFT_STORAGE_API_KEY is kept strictly server-side (read from DB or env).
   */
  app.post(
    "/api/upload",
    upload.single("file"),
    async (req: Request, res: Response) => {
      try {
        // Read API key from DB (falls back to process.env)
        const apiKey = await getConfigValue(CONFIG_KEYS.NFT_STORAGE_API_KEY);

        if (!apiKey) {
          res.status(503).json({
            error: "NFT.Storage API key is not configured. Please visit Settings to add it.",
          });
          return;
        }

        if (!req.file) {
          res.status(400).json({ error: "No file provided." });
          return;
        }

        const { buffer, mimetype, originalname } = req.file;

        // Forward the raw file bytes to NFT.Storage
        const nftStorageRes = await fetch("https://api.nft.storage/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": mimetype || "application/octet-stream",
          },
          body: new Uint8Array(buffer),
        });

        if (!nftStorageRes.ok) {
          const errText = await nftStorageRes.text();
          console.error("[upload-proxy] NFT.Storage error:", errText);
          res.status(502).json({ error: "NFT.Storage upload failed.", detail: errText });
          return;
        }

        const data = (await nftStorageRes.json()) as {
          ok: boolean;
          value: { cid: string };
        };

        if (!data.ok || !data.value?.cid) {
          res.status(502).json({ error: "NFT.Storage returned an unexpected response." });
          return;
        }

        const cid = data.value.cid;
        const mediaUrl = `https://${cid}.ipfs.dweb.link/`;

        res.json({ cid, mediaUrl, filename: originalname });
      } catch (err) {
        console.error("[upload-proxy] Unexpected error:", err);
        res.status(500).json({ error: "Internal server error during upload." });
      }
    }
  );
}
