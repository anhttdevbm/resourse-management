"""Tạo và upload file seed thật (local + MinIO/S3) để tải xuống được."""
from __future__ import annotations

import io
import re
import struct
import zipfile
import zlib
from pathlib import Path

_FOLDER_MAP: dict[str, str] = {
    "jpg": "images",
    "jpeg": "images",
    "png": "images",
    "gif": "images",
    "webp": "images",
    "pdf": "documents",
    "doc": "documents",
    "docx": "documents",
    "txt": "documents",
    "md": "documents",
    "rtf": "documents",
    "mp4": "videos",
    "avi": "videos",
    "mov": "videos",
    "mp3": "audio",
    "wav": "audio",
    "zip": "archives",
    "rar": "archives",
    "7z": "archives",
    "tar": "archives",
    "exe": "software",
    "msi": "software",
    "dmg": "software",
    "deb": "software",
    "apk": "software",
    "aab": "software",
    "iso": "archives",
}


def _safe_slug(name: str, max_len: int = 72) -> str:
    slug = re.sub(r"[^\w.\-]+", "_", name.strip())
    return slug[:max_len] or "resource"


def resource_storage_paths(name: str, version: str, ext: str) -> tuple[str, str]:
    """Trả về (url_db, s3_key) — khớp resource_service.upload_resource."""
    folder = _FOLDER_MAP.get(ext.lower(), "others")
    filename = f"{version}_{_safe_slug(name)}.{ext.lower()}"
    key = f"uploads/{folder}/{filename}"
    return f"/{key}", key


def _minimal_png() -> bytes:
    # 1x1 PNG đỏ
    return (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01"
        b"\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc"
        b"\xf8\xcf\xc0\x00\x00\x00\x03\x00\x01\x00\x05\xfe\xd4\x00\x00\x00\x00IEND\xaeB`\x82"
    )


def _minimal_pdf(title: str, version: str) -> bytes:
    text = f"RMS Demo — {title} v{version}"
    stream = f"BT /F1 14 Tf 50 750 Td ({text}) Tj ET"
    objects = [
        b"1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n",
        b"2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n",
        (
            b"3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
            b"/Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj\n"
        ),
        f"4 0 obj<< /Length {len(stream)} >>stream\n{stream}\nendstream endobj\n".encode(),
        b"5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n",
    ]
    body = b"".join(objects)
    header = b"%PDF-1.4\n"
    offsets = [0]
    pos = len(header)
    for obj in objects:
        offsets.append(pos)
        pos += len(obj)
    xref_pos = pos
    xref = [b"xref\n0 6\n", b"0000000000 65535 f \n"]
    for off in offsets[1:]:
        xref.append(f"{off:010d} 00000 n \n".encode())
    trailer = (
        f"trailer<< /Size 6 /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF".encode()
    )
    return header + body + b"".join(xref) + trailer


def generate_file_content(ext: str, title: str, version: str) -> bytes:
    ext = ext.lower()
    header = f"RMS Resource Management — {title} v{version}\n".encode()
    body = (
        f"Tệp demo seed.\n"
        f"Tên: {title}\n"
        f"Phiên bản: {version}\n"
        f"Ngày tạo seed: hệ thống tự sinh khi docker compose up.\n"
    ).encode()

    if ext in ("txt", "md"):
        return header + body
    if ext == "pdf":
        return _minimal_pdf(title, version)
    if ext == "png":
        return _minimal_png()
    if ext == "zip":
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr("README.txt", header + body)
            zf.writestr(
                f"{_safe_slug(title)}-{version}.json",
                b'{"name":"' + title.encode() + b'","version":"' + version.encode() + b'"}',
            )
        return buf.getvalue()
    if ext in ("rar", "7z", "iso", "deb", "dmg", "msi", "exe", "apk", "aab"):
        # Stub nhị phân — đủ để tải về; nội dung mô tả trong header nén
        return header + body + b"\n" + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF)
    return header + body


def local_upload_roots() -> list[Path]:
    roots: list[Path] = []
    for candidate in (Path("/app/app"), Path("/app"), Path.cwd()):
        if candidate.exists() and candidate not in roots:
            roots.append(candidate)
    return roots or [Path.cwd()]


def write_local_file(key: str, content: bytes) -> None:
    for root in local_upload_roots():
        path = root / key
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)


def local_file_exists(key: str) -> bool:
    return any((root / key).is_file() for root in local_upload_roots())


def s3_object_exists(s3, key: str) -> bool:
    try:
        s3.client.head_object(Bucket=s3.s3_bucket, Key=key)
        return True
    except Exception:
        return False


def upload_seed_file(s3, url: str, content: bytes) -> bool:
    key = url.lstrip("/")
    write_local_file(key, content)
    try:
        s3.put_object(key, content)
        return True
    except Exception as exc:
        print(f"  warn: S3 upload failed for {key}: {exc}")
        return local_file_exists(key)


def ensure_resource_file(s3, url: str, name: str, version: str, ext: str) -> str:
    """Đảm bảo file tồn tại; trả về url chuẩn (uploads/{folder}/...)."""
    target_url, target_key = resource_storage_paths(name, version, ext)

    if local_file_exists(target_key) and (s3 is None or s3_object_exists(s3, target_key)):
        return target_url

    content = generate_file_content(ext, name, version)
    if s3 is not None:
        upload_seed_file(s3, target_url, content)
    else:
        write_local_file(target_key, content)
    return target_url
