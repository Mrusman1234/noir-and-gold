import os
import sys
import fitz # PyMuPDF
from pypdf import PdfReader

PDF_PATH = r"C:\Users\premier\Desktop\cloths store\NOIR_AND_GOLD_COMPLETE_TECHNICAL_DOCUMENTATION.pdf"
RENDER_DIR = r"C:\Users\premier\Desktop\cloths store\scripts\rendered_pages"

os.makedirs(RENDER_DIR, exist_ok=True)

print("=== 1. VERIFY FILE EXISTENCE & HEADER ===")
if not os.path.exists(PDF_PATH):
    print(f"ERROR: File does not exist at {PDF_PATH}")
    sys.exit(1)

size_bytes = os.path.getsize(PDF_PATH)
print(f"File exists: {PDF_PATH}")
print(f"File size: {size_bytes} bytes ({size_bytes / 1024:.2f} KB)")

with open(PDF_PATH, "rb") as f:
    header = f.read(16)
    print(f"Header bytes: {header}")
    if header.startswith(b"%PDF-"):
        print(f"VALID PDF HEADER: {header[:8].decode('ascii', errors='ignore')}")
    else:
        print("ERROR: File does not start with a valid %PDF- header!")
        sys.exit(1)

print("\n=== 2. PARSE WITH PYPDF & FITZ ===")
reader = PdfReader(PDF_PATH)
num_pages = len(reader.pages)
print(f"pypdf: Successfully opened PDF. Total pages = {num_pages}")

doc = fitz.open(PDF_PATH)
print(f"fitz (PyMuPDF): Successfully opened document. Page count = {doc.page_count}")
print(f"Is encrypted: {doc.is_encrypted}")
print(f"PDF Metadata: {doc.metadata}")

print("\n=== 3. CHAPTER TEXT DETECTION & EXTRACTION ===")
expected_chapters = [
    "Project Overview & Executive Summary",
    "Technology Stack & Tooling Guide",
    "Repository Architecture & File Map",
    "Frontend Architecture & App Router",
    "Backend Architecture & Express",
    "Complete API Reference",
    "Database Design & Prisma ORM",
    "Authentication, Authorization & Security",
    "E-Commerce Business Workflows",
    "Developer Environment Setup",
    "Testing Strategy & Test Suite",
    "Production Deployment & Operations",
    "Full-Stack Engineer Learning Roadmap",
    "Technical Glossary & Senior Interview",
]

found_chapters = {}
full_text_sample = []

for page_idx in range(doc.page_count):
    page = doc.load_page(page_idx)
    text = page.get_text()
    
    for ch in expected_chapters:
        if ch.lower() in text.lower():
            if ch not in found_chapters:
                found_chapters[ch] = page_idx + 1

print("Found Chapters across pages:")
for ch in expected_chapters:
    if ch in found_chapters:
        print(f"  [PASS] '{ch}' detected on Page {found_chapters[ch]}")
    else:
        print(f"  [MISSING] '{ch}' not found in text stream!")

print(f"\nTotal expected chapters found: {len(found_chapters)} / {len(expected_chapters)}")

print("\n=== 4. RENDERING SAMPLE PAGES TO PNG ===")
sample_pages = [0, 1, 2, 7, 20, doc.page_count - 1] # Cover, TOC, Ch 1, Ch 7, Glossary
rendered_files = []

for p_no in sample_pages:
    if p_no < doc.page_count:
        page = doc.load_page(p_no)
        pix = page.get_pixmap(dpi=150)
        img_name = f"page_{p_no + 1}.png"
        img_path = os.path.join(RENDER_DIR, img_name)
        pix.save(img_path)
        rendered_files.append((p_no + 1, img_path, os.path.getsize(img_path)))
        print(f"Rendered Page {p_no + 1} -> {img_path} ({os.path.getsize(img_path)} bytes)")

print("\n=== VERIFICATION FINISHED ===")
