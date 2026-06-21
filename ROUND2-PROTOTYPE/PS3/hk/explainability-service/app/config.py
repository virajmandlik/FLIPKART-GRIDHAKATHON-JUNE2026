"""Application configuration loaded from environment variables."""

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # Service
    service_name: str = "explainability-service"
    log_level: str = "INFO"

    # Database (MongoDB)
    mongo_uri: str = "mongodb://localhost:27017"
    mongo_db: str = "explainability"
    mongo_collection: str = "explanation_records"

    # Image / proof storage
    # "local" writes annotated proofs to disk (use /tmp on Lambda);
    # "s3" uploads to an S3 bucket (default for Lambda deployments).
    storage_backend: Literal["local", "s3"] = "s3"
    local_storage_dir: str = "/tmp/proofs"
    s3_bucket: str = ""
    s3_prefix: str = "proofs/"
    aws_region: str = "us-east-1"

    # Human-in-the-loop gate.
    # Violations at or above this confidence (percent, 0-100) are
    # auto-approved; anything below is flagged for manual review.
    auto_approval_threshold: float = 90.0


@lru_cache
def get_settings() -> Settings:
    return Settings()
