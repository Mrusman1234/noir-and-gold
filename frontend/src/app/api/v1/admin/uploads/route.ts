import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth-guard";
import {
  saveUploadedFile,
  validateImageMetadata,
} from "@/lib/storage-service";

export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth(request, ["ADMIN", "STAFF"]);
  if ("status" in auth) return auth;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string" || !(file instanceof Blob)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NO_FILE_PROVIDED", message: "Please select an image file to upload." },
        },
        { status: 400 }
      );
    }

    const validation = validateImageMetadata({ size: file.size, type: file.type });
    if (!validation.valid && validation.error) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await saveUploadedFile(
      buffer,
      file instanceof File ? file.name : "upload",
      file.type
    );

    return NextResponse.json({
      success: true,
      file: uploadResult,
      url: uploadResult.url,
      filename: uploadResult.filename,
      size: uploadResult.sizeBytes,
      mimeType: uploadResult.mimeType,
      message: "Image uploaded and stored successfully.",
    });
  } catch (error) {
    console.error("Admin upload API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "UPLOAD_FAILED", message: "Failed to upload image file." },
      },
      { status: 500 }
    );
  }
}
