import assert from "node:assert/strict";
import { copyFileSync, existsSync, mkdtempSync, rmSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { NextRequest } from "next/server";
import { AdminUser } from "../src/types";

const repositoryRoot = path.resolve(__dirname, "..", "..");
const temporaryDirectory = mkdtempSync(path.join(tmpdir(), "noir-upload-test-"));
const testDatabasePath = path.join(temporaryDirectory, "upload-test.sqlite");
process.env.DATABASE_URL = `file:${testDatabasePath.replace(/\\/g, "/")}`;
copyFileSync(path.join(repositoryRoot, "backend", "prisma", "dev.db"), testDatabasePath);

let prisma: typeof import("../src/lib/prisma").prisma;
let createAdminSessionForUser: typeof import("../src/lib/admin-service").createAdminSessionForUser;
let uploadRoute: typeof import("../src/app/api/v1/admin/uploads/route");
let storageService: typeof import("../src/lib/storage-service");

const filesToCleanUp: string[] = [];

const setupPromise = Promise.all([
  import("../src/lib/prisma"),
  import("../src/lib/admin-service"),
  import("../src/app/api/v1/admin/uploads/route"),
  import("../src/lib/storage-service"),
]).then(([prismaMod, adminServiceMod, uploadRouteMod, storageMod]) => {
  prisma = prismaMod.prisma;
  createAdminSessionForUser = adminServiceMod.createAdminSessionForUser;
  uploadRoute = uploadRouteMod;
  storageService = storageMod;
});

after(async () => {
  await setupPromise.catch(() => undefined);
  if (prisma) await prisma.$disconnect();
  rmSync(temporaryDirectory, { recursive: true, force: true });

  // Clean up any files created during tests
  for (const filePath of filesToCleanUp) {
    try {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    } catch {
      // Ignore cleanup error
    }
  }
});

test("Storage Service: validateImageMetadata checks file types and byte limits", async () => {
  await setupPromise;

  // Valid JPEG
  const validJpg = storageService.validateImageMetadata({ size: 1024 * 1024, type: "image/jpeg" });
  assert.equal(validJpg.valid, true);

  // Valid PNG
  const validPng = storageService.validateImageMetadata({ size: 2 * 1024 * 1024, type: "image/png" });
  assert.equal(validPng.valid, true);

  // Valid WebP
  const validWebp = storageService.validateImageMetadata({ size: 500 * 1024, type: "image/webp" });
  assert.equal(validWebp.valid, true);

  // Invalid MIME type (GIF)
  const invalidMime = storageService.validateImageMetadata({ size: 1024, type: "image/gif" });
  assert.equal(invalidMime.valid, false);
  assert.equal(invalidMime.error?.code, "INVALID_FILE_TYPE");

  // Invalid MIME type (Executable / Script)
  const exeMime = storageService.validateImageMetadata({ size: 1024, type: "application/x-msdownload" });
  assert.equal(exeMime.valid, false);
  assert.equal(exeMime.error?.code, "INVALID_FILE_TYPE");

  // Oversized file (> 5 MB)
  const oversized = storageService.validateImageMetadata({
    size: 5 * 1024 * 1024 + 100,
    type: "image/png",
  });
  assert.equal(oversized.valid, false);
  assert.equal(oversized.error?.code, "FILE_TOO_LARGE");
});

test("Storage Service: generateUniqueFilename produces collision-resistant filenames", async () => {
  await setupPromise;

  const fn1 = storageService.generateUniqueFilename("jpg");
  const fn2 = storageService.generateUniqueFilename(".webp");

  assert.ok(fn1.endsWith(".jpg"));
  assert.ok(fn2.endsWith(".webp"));
  assert.notEqual(fn1, fn2);
  assert.match(fn1, /^\d+-[a-f0-9]+\.jpg$/);
});

test("Storage Service: saveUploadedFile saves locally and returns UploadResult", async () => {
  await setupPromise;

  const sampleBuffer = Buffer.from("NOIR_AND_GOLD_ATELIER_SAMPLE_RAW_IMAGE_DATA");
  const result = await storageService.saveUploadedFile(sampleBuffer, "test-garment.webp", "image/webp");

  assert.ok(result.url.startsWith("/uploads/products/"));
  assert.ok(result.filename.endsWith(".webp"));
  assert.equal(result.sizeBytes, sampleBuffer.length);
  assert.equal(result.mimeType, "image/webp");

  // Verify file was written to disk
  const localDir = storageService.getLocalStorageDirectory();
  const diskPath = path.join(localDir, result.filename);
  assert.equal(existsSync(diskPath), true);
  filesToCleanUp.push(diskPath);
});

test("Upload API: Unauthenticated request is rejected with 401 UNAUTHORIZED", async () => {
  await setupPromise;

  const formData = new FormData();
  formData.append("file", new Blob(["test"], { type: "image/png" }), "test.png");

  const request = new NextRequest("http://localhost:3000/api/v1/admin/uploads", {
    method: "POST",
    body: formData,
  });

  const response = await uploadRoute.POST(request);
  assert.equal(response.status, 401);

  const body = await response.json();
  assert.equal(body.success, false);
  assert.equal(body.error.code, "UNAUTHORIZED");
});

test("Upload API: Request with insufficient role is rejected with 403 FORBIDDEN", async () => {
  await setupPromise;

  // CUSTOMER role is not permitted for admin uploads
  const customerUser: AdminUser = {
    id: "usr_cust_001",
    email: "customer@noirgold.test",
    name: "Regular Customer",
    role: "CUSTOMER",
    createdAt: new Date().toISOString(),
  };
  const token = createAdminSessionForUser(customerUser);

  const formData = new FormData();
  formData.append("file", new Blob(["test"], { type: "image/png" }), "test.png");

  const request = new NextRequest("http://localhost:3000/api/v1/admin/uploads", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Origin: "http://localhost:3000",
    },
    body: formData,
  });

  const response = await uploadRoute.POST(request);
  assert.equal(response.status, 403);

  const body = await response.json();
  assert.equal(body.success, false);
  assert.equal(body.error.code, "FORBIDDEN_INSUFFICIENT_ROLE");
});

test("Upload API: Rejects request with missing file (400 NO_FILE_PROVIDED)", async () => {
  await setupPromise;

  const staffUser: AdminUser = {
    id: "usr_staff_upload_1",
    email: "staff.uploader@noirgold.test",
    name: "Staff Uploader",
    role: "STAFF",
    createdAt: new Date().toISOString(),
  };
  const token = createAdminSessionForUser(staffUser);

  const emptyFormData = new FormData();

  const request = new NextRequest("http://localhost:3000/api/v1/admin/uploads", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Origin: "http://localhost:3000",
    },
    body: emptyFormData,
  });

  const response = await uploadRoute.POST(request);
  assert.equal(response.status, 400);

  const body = await response.json();
  assert.equal(body.success, false);
  assert.equal(body.error.code, "NO_FILE_PROVIDED");
});

test("Upload API: Rejects unsupported file format with 400 INVALID_FILE_TYPE", async () => {
  await setupPromise;

  const staffUser: AdminUser = {
    id: "usr_staff_upload_2",
    email: "staff.uploader@noirgold.test",
    name: "Staff Uploader",
    role: "STAFF",
    createdAt: new Date().toISOString(),
  };
  const token = createAdminSessionForUser(staffUser);

  const formData = new FormData();
  formData.append(
    "file",
    new Blob(["%PDF-1.4 test content"], { type: "application/pdf" }),
    "document.pdf"
  );

  const request = new NextRequest("http://localhost:3000/api/v1/admin/uploads", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Origin: "http://localhost:3000",
    },
    body: formData,
  });

  const response = await uploadRoute.POST(request);
  assert.equal(response.status, 400);

  const body = await response.json();
  assert.equal(body.success, false);
  assert.equal(body.error.code, "INVALID_FILE_TYPE");
});

test("Upload API: Successfully uploads image, persists to disk, and returns structured metadata", async () => {
  await setupPromise;

  const adminUser: AdminUser = {
    id: "usr_admin_upload_1",
    email: "admin.uploader@noirgold.test",
    name: "Admin Uploader",
    role: "ADMIN",
    createdAt: new Date().toISOString(),
  };
  const token = createAdminSessionForUser(adminUser);

  // 1 KB sample webp payload
  const imagePayload = Buffer.alloc(1024, 0x42);
  const formData = new FormData();
  formData.append(
    "file",
    new Blob([imagePayload], { type: "image/webp" }),
    "sherwani-couture.webp"
  );

  const request = new NextRequest("http://localhost:3000/api/v1/admin/uploads", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Origin: "http://localhost:3000",
    },
    body: formData,
  });

  const response = await uploadRoute.POST(request);
  assert.equal(response.status, 200);

  const body = await response.json();
  assert.equal(body.success, true);
  assert.ok(body.file);
  assert.ok(body.file.url.startsWith("/uploads/products/"));
  assert.ok(body.file.filename.endsWith(".webp"));
  assert.equal(body.file.sizeBytes, 1024);
  assert.equal(body.file.mimeType, "image/webp");

  // Verify file was written to disk
  const localDir = storageService.getLocalStorageDirectory();
  const diskPath = path.join(localDir, body.file.filename);
  assert.equal(existsSync(diskPath), true);
  filesToCleanUp.push(diskPath);
});
