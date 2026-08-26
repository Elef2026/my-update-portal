import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files received" }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const uploadedUrls: { fileUrl: string; fileType: string; fileName: string }[] = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Clean filename
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${safeName}`;
      const filePath = path.join(uploadDir, uniqueName);

      await writeFile(filePath, buffer);

      const fileType = file.type.includes("pdf") 
        ? "PDF_DOCUMENT" 
        : file.type.includes("image") 
        ? "IMAGE" 
        : "DOCUMENT";

      uploadedUrls.push({
        fileUrl: `/uploads/${uniqueName}`,
        fileType,
        fileName: file.name,
      });
    }

    return NextResponse.json({ success: true, files: uploadedUrls }, { status: 201 });
  } catch (error: any) {
    console.error("File upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload files" }, { status: 500 });
  }
}
