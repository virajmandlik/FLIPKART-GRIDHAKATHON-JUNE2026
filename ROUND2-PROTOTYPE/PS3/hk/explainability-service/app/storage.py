"""Proof image storage backends: local filesystem or S3.

On Lambda, only /tmp is writable, so the S3 backend is the default. The
local backend is primarily for development and tests.
"""

from __future__ import annotations

import os
from abc import ABC, abstractmethod
from urllib.parse import urlparse

from app.config import Settings


class StorageBackend(ABC):
    @abstractmethod
    def save(self, key: str, data: bytes, content_type: str = "image/jpeg") -> str:
        """Persist bytes under `key` and return a URI to the stored object."""

    @abstractmethod
    def load(self, uri: str) -> bytes:
        """Read bytes from a stored URI (or source image)."""


class LocalStorage(StorageBackend):
    def __init__(self, base_dir: str) -> None:
        self.base_dir = base_dir
        os.makedirs(self.base_dir, exist_ok=True)

    def save(self, key: str, data: bytes, content_type: str = "image/jpeg") -> str:
        path = os.path.join(self.base_dir, key)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "wb") as fh:
            fh.write(data)
        return path

    def load(self, uri: str) -> bytes:
        path = uri[len("file://") :] if uri.startswith("file://") else uri
        with open(path, "rb") as fh:
            return fh.read()


class S3Storage(StorageBackend):
    def __init__(self, bucket: str, prefix: str, region: str) -> None:
        import boto3  # imported lazily so local/dev needs no AWS deps

        self.bucket = bucket
        self.prefix = prefix.rstrip("/") + "/" if prefix else ""
        self.client = boto3.client("s3", region_name=region)

    def save(self, key: str, data: bytes, content_type: str = "image/jpeg") -> str:
        full_key = f"{self.prefix}{key}"
        self.client.put_object(
            Bucket=self.bucket, Key=full_key, Body=data, ContentType=content_type
        )
        return f"s3://{self.bucket}/{full_key}"

    def load(self, uri: str) -> bytes:
        parsed = urlparse(uri)
        if parsed.scheme != "s3":
            # Allow loading a local source image even when saving to S3.
            with open(uri, "rb") as fh:
                return fh.read()
        bucket = parsed.netloc
        key = parsed.path.lstrip("/")
        resp = self.client.get_object(Bucket=bucket, Key=key)
        return resp["Body"].read()


def get_storage(settings: Settings) -> StorageBackend:
    if settings.storage_backend == "s3":
        if not settings.s3_bucket:
            raise ValueError("s3_bucket must be set when storage_backend is 's3'")
        return S3Storage(settings.s3_bucket, settings.s3_prefix, settings.aws_region)
    return LocalStorage(settings.local_storage_dir)
