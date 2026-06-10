"""File upload routes — handles PDF resume and JD parsing."""

from fastapi import APIRouter, UploadFile, File
from PyPDF2 import PdfReader
import io

router = APIRouter()


@router.post("/parse-pdf")
async def parse_pdf(file: UploadFile = File(...)):
    """Upload a PDF file and extract its text content."""
    if not file.filename.endswith(".pdf"):
        return {"error": "Only PDF files are supported", "text": ""}

    try:
        contents = await file.read()
        reader = PdfReader(io.BytesIO(contents))

        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"

        return {"text": text.strip(), "pages": len(reader.pages)}
    except Exception as e:
        return {"error": f"Failed to parse PDF: {str(e)}", "text": ""}
