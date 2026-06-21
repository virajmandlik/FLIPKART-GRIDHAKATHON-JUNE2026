"""Pack the repository into MongoDB so it can be restored on another machine.

Each file is stored as one document in the `repo_files` collection:
    { _id: <relative/path>, content_b64, size, sha256, mode, is_binary }

Use scripts/mongo_to_repo.py on the other laptop to restore.

Usage (PowerShell), from the repo root::

    $env:MONGO_URI = "mongodb+srv://..."
    $env:MONGO_DB  = "violation_detection"
    .venv/Scripts/python.exe scripts/repo_to_mongo.py
    .venv/Scripts/python.exe scripts/repo_to_mongo.py --include-env   # also store .env

The connection details come from app settings (env vars or .env).
"""

from __future__ import annotations

import argparse
import base64
import fnmatch
import hashlib
import os
import sys
from datetime import datetime, timezone

from pymongo import MongoClient

sys.path.insert(0, ".")
from app.config import get_settings  # noqa: E402

REPO_FILES_COLLECTION = "repo_files"

# Directories and files never copied (machine-specific, secret, or regenerated).
EXCLUDE_DIRS = {
    ".venv", "venv", "__pycache__", ".pytest_cache", ".git",
    ".aws-sam", "data", ".mypy_cache", ".ruff_cache", "node_modules",
}
EXCLUDE_GLOBS = [
    "*.pyc", "*.pyo", "*.pyd", "*.log", "*.tmp",
]


def _should_skip(rel_path: str, include_env: bool) -> bool:
    parts = rel_path.replace("\\", "/").split("/")
    if any(part in EXCLUDE_DIRS for part in parts):
        return True
    name = parts[-1]
    if not include_env and (name == ".env" or name.startswith(".env.")
                            and name != ".env.example"):
        return True
    return any(fnmatch.fnmatch(name, pat) for pat in EXCLUDE_GLOBS)


def main() -> int:
    parser = argparse.ArgumentParser(description="Pack repo into MongoDB.")
    parser.add_argument("--root", default=".", help="Repo root (default: .)")
    parser.add_argument("--include-env", action="store_true",
                        help="Also store .env files (contains secrets!)")
    args = parser.parse_args()

    settings = get_settings()
    root = os.path.abspath(args.root)
    print(f"Packing repo at: {root}")
    print(f"-> MongoDB db='{settings.mongo_db}' "
          f"collection='{REPO_FILES_COLLECTION}'")

    client = MongoClient(settings.mongo_uri, tz_aware=True,
                         serverSelectionTimeoutMS=10000)
    client.admin.command("ping")
    collection = client[settings.mongo_db][REPO_FILES_COLLECTION]

    # Fresh snapshot: clear any previous packing.
    deleted = collection.delete_many({}).deleted_count
    if deleted:
        print(f"Cleared {deleted} previously stored file(s).")

    stored = 0
    skipped = 0
    for dirpath, dirnames, filenames in os.walk(root):
        # Prune excluded dirs in-place so os.walk doesn't descend into them.
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
        for filename in filenames:
            abs_path = os.path.join(dirpath, filename)
            rel_path = os.path.relpath(abs_path, root).replace("\\", "/")
            if _should_skip(rel_path, args.include_env):
                skipped += 1
                continue

            with open(abs_path, "rb") as fh:
                raw = fh.read()

            collection.replace_one(
                {"_id": rel_path},
                {
                    "_id": rel_path,
                    "content_b64": base64.b64encode(raw).decode("ascii"),
                    "size": len(raw),
                    "sha256": hashlib.sha256(raw).hexdigest(),
                    "mode": oct(os.stat(abs_path).st_mode & 0o777),
                    "packed_at": datetime.now(timezone.utc),
                },
                upsert=True,
            )
            stored += 1
            print(f"  + {rel_path} ({len(raw)} bytes)")

    print(f"\nStored {stored} file(s), skipped {skipped}.")
    print("Run scripts/mongo_to_repo.py on the target machine to restore.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
