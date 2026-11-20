import io
import pytest
from app import create_app
from app.config import TestingConfig
from app.extensions import db
from app.services.pdf_service import extract_text_from_pdf, PDFExtractionError


SAMPLE_VALID_PDF = b"""%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 72 >> stream
BT
/F1 12 Tf
100 700 Td
(Photosynthesis converts radiant solar energy into chemical bond energy.) Tj
ET
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000367 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
443
%%EOF"""


@pytest.fixture
def app():
    test_app = create_app(TestingConfig)
    with test_app.app_context():
        db.create_all()
        yield test_app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


def test_pdf_extraction_success():
    """Test extracting text and metadata from valid PDF."""
    result = extract_text_from_pdf(SAMPLE_VALID_PDF)
    assert result["total_pages"] == 1
    assert "Photosynthesis" in result["text"]
    assert result["total_words"] >= 5
    assert len(result["pages"]) == 1
    assert result["pages"][0]["page_number"] == 1


def test_pdf_extraction_corrupted_bytes():
    """Corrupted or non-pdf bytes should raise PDFExtractionError."""
    with pytest.raises(PDFExtractionError):
        extract_text_from_pdf(b"Not a PDF file at all.")


def test_source_upload_pdf_file(client):
    """Test POST /api/v1/source/upload with multipart PDF file."""
    data = {
        "file": (io.BytesIO(SAMPLE_VALID_PDF), "biology_chapter_photosynthesis.pdf"),
        "subject": "Life Sciences",
        "title": "Plant Bioenergetics",
    }
    res = client.post(
        "/api/v1/source/upload",
        data=data,
        content_type="multipart/form-data",
    )
    assert res.status_code == 200
    json_data = res.get_json()
    assert json_data["message"] == "Source material parsed and indexed successfully"
    assert "Photosynthesis" in json_data["text"]
    assert json_data["total_pages"] == 1
    assert json_data["chunks_indexed"] >= 1
    assert json_data["document_title"] == "Plant Bioenergetics"


def test_source_upload_invalid_file_extension(client):
    """Uploading non-pdf via file field should return 400 error."""
    data = {
        "file": (io.BytesIO(b"Hello world"), "notes.docx"),
    }
    res = client.post(
        "/api/v1/source/upload",
        data=data,
        content_type="multipart/form-data",
    )
    assert res.status_code == 400
    assert "Only PDF documents (.pdf) are supported" in res.get_json()["error"]


def test_test_generate_with_pdf_upload(client):
    """Test generating a grounded test directly from a PDF file upload."""
    data = {
        "file": (io.BytesIO(SAMPLE_VALID_PDF), "cellular_biology.pdf"),
        "subject": "Life Sciences",
        "topic": "Photosynthesis",
        "difficulty": "medium",
        "num_questions": 2,
    }
    res = client.post(
        "/api/v1/test/generate",
        data=data,
        content_type="multipart/form-data",
    )
    assert res.status_code == 201
    json_data = res.get_json()
    assert "test" in json_data
    assert len(json_data["test"]["questions"]) == 2
    assert json_data["test"]["subject"] == "Life Sciences"
