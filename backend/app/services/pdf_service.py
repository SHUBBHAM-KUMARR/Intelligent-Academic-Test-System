import io
import re
import logging
from typing import Dict, Any, List
from pypdf import PdfReader

logger = logging.getLogger(__name__)


class PDFExtractionError(Exception):
    """Custom exception raised when PDF parsing fails."""
    pass


def extract_text_from_pdf(file_bytes_or_stream, max_pages: int = 150) -> Dict[str, Any]:
    """
    Extract readable text and metadata from a PDF file stream or raw bytes.

    Args:
        file_bytes_or_stream: BytesIO, file-like object, or bytes of the PDF.
        max_pages: Maximum number of pages to process.

    Returns:
        dict:
            - text (str): Full concatenated cleaned text across all pages.
            - total_pages (int): Number of pages in the PDF.
            - pages_processed (int): Number of pages processed.
            - pages (List[Dict]): List of {page_number, text, word_count}.
            - total_words (int): Total word count.
            - title (str): Metadata title if present.
            - author (str): Metadata author if present.
    """
    try:
        if isinstance(file_bytes_or_stream, bytes):
            stream = io.BytesIO(file_bytes_or_stream)
        elif hasattr(file_bytes_or_stream, "read"):
            content = file_bytes_or_stream.read()
            stream = io.BytesIO(content)
        else:
            stream = file_bytes_or_stream

        reader = PdfReader(stream)
        if reader.is_encrypted:
            try:
                reader.decrypt("")
            except Exception as dec_err:
                raise PDFExtractionError("The uploaded PDF is password-protected and cannot be read.") from dec_err

        total_pages = len(reader.pages)
        if total_pages == 0:
            raise PDFExtractionError("The uploaded PDF file has 0 pages.")

        pages_to_process = min(total_pages, max_pages)
        page_records: List[Dict[str, Any]] = []
        full_text_parts: List[str] = []

        for idx in range(pages_to_process):
            page = reader.pages[idx]
            extracted = page.extract_text() or ""
            # Normalize excessive spaces while keeping paragraphs
            cleaned_page = re.sub(r"[ \t]+", " ", extracted).strip()

            if cleaned_page:
                full_text_parts.append(cleaned_page)
                page_records.append({
                    "page_number": idx + 1,
                    "text": cleaned_page,
                    "word_count": len(cleaned_page.split()),
                })

        full_text = "\n\n".join(full_text_parts).strip()

        if not full_text:
            raise PDFExtractionError(
                "No readable text could be extracted from this PDF. "
                "It may be a scanned image or non-searchable document."
            )

        meta = reader.metadata or {}
        doc_title = getattr(meta, "title", None) or ""
        doc_author = getattr(meta, "author", None) or ""

        return {
            "text": full_text,
            "total_pages": total_pages,
            "pages_processed": pages_to_process,
            "pages": page_records,
            "total_words": len(full_text.split()),
            "title": doc_title,
            "author": doc_author,
        }

    except PDFExtractionError:
        raise
    except Exception as e:
        logger.error(f"Error extracting PDF: {e}")
        raise PDFExtractionError(f"Failed to read PDF file: {str(e)}") from e
