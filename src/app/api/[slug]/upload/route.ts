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

      const match = dataUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (!match) {
        return NextResponse.json({ error: "Invalid dataUrl format." }, { status: 400 });
      }

      ext = match[1] === "png" ? "png" : match[1] === "webp" ? "webp" : "jpg";
      buffer = Buffer.from(match[2], "base64");
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "file is required." }, { status: 400 });
      }
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      if (file.name.endsWith(".png")) ext = "png";
      else if (file.name.endsWith(".webp")) ext = "webp";
    } else {
      return NextResponse.json({ error: "Unsupported content type." }, { status: 400 });
    }

    const filename = `banner-${slug}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
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

