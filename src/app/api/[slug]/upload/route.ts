import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await props.params;

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "banners");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const contentType = req.headers.get("content-type") || "";

    let buffer: Buffer;
    let ext = "jpg";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      const { dataUrl } = body;
      if (!dataUrl) {
        return NextResponse.json({ error: "dataUrl is required." }, { status: 400 });
      }

      // Check image or video dataUrl
      const imgMatch = dataUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      const vidMatch = dataUrl.match(/^data:video\/([a-zA-Z0-9+]+);base64,(.+)$/);

      if (imgMatch) {
        const subtype = imgMatch[1].toLowerCase();
        ext = subtype === "png" ? "png" : subtype === "webp" ? "webp" : subtype === "gif" ? "gif" : "jpg";
        buffer = Buffer.from(imgMatch[2], "base64");
      } else if (vidMatch) {
        const subtype = vidMatch[1].toLowerCase();
        ext = subtype === "webm" ? "webm" : subtype === "quicktime" ? "mov" : "mp4";
        buffer = Buffer.from(vidMatch[2], "base64");
      } else {
        return NextResponse.json({ error: "Invalid dataUrl format." }, { status: 400 });
      }
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "file is required." }, { status: 400 });
      }
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);

      const lowerName = file.name.toLowerCase();
      const mime = file.type.toLowerCase();

      if (lowerName.endsWith(".png") || mime === "image/png") ext = "png";
      else if (lowerName.endsWith(".webp") || mime === "image/webp") ext = "webp";
      else if (lowerName.endsWith(".gif") || mime === "image/gif") ext = "gif";
      else if (lowerName.endsWith(".mp4") || mime === "video/mp4") ext = "mp4";
      else if (lowerName.endsWith(".webm") || mime === "video/webm") ext = "webm";
      else if (lowerName.endsWith(".mov") || lowerName.endsWith(".quicktime") || mime === "video/quicktime") ext = "mov";
      else if (lowerName.endsWith(".m4v") || mime === "video/x-m4v") ext = "m4v";
      else ext = "jpg";
    } else {
      return NextResponse.json({ error: "Unsupported content type." }, { status: 400 });
    }

    // Generate clean, deterministic sequence order filename (never raw client filename)
    const existingFiles = await fs.promises.readdir(uploadsDir).catch(() => []);
    const nextSeq = String(existingFiles.length + 1).padStart(4, "0");
    const timestamp = Date.now();
    const filename = `tile_seq_${nextSeq}_${timestamp}.${ext}`;
    const filePath = path.join(uploadsDir, filename);

    await fs.promises.writeFile(filePath, buffer);

    const publicUrl = `/uploads/banners/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
    });
  } catch (err: any) {
    console.error("Upload banner error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
