#!/usr/bin/env python3
"""Zmaze z Cloudinary videa v priecinku facelessfactory/ staorsie nez N dni
(uz davno postnute Bufferom). Drzi Cloudinary free tier vzdy volny."""
import datetime
import os

import cloudinary
import cloudinary.api

import appconfig

KEEP_DAYS = int(os.environ.get("CLOUDINARY_KEEP_DAYS", "7"))

cfg = appconfig.load()
cloudinary.config(
    cloud_name=cfg["cloudinary_cloud_name"],
    api_key=cfg["cloudinary_api_key"],
    api_secret=cfg["cloudinary_api_secret"],
    secure=True,
)

cutoff = datetime.datetime.utcnow() - datetime.timedelta(days=KEEP_DAYS)


def parse(ts):
    return datetime.datetime.strptime(ts, "%Y-%m-%dT%H:%M:%SZ")


def main():
    old = []
    cursor = None
    while True:
        resp = cloudinary.api.resources(
            type="upload", resource_type="video", prefix="facelessfactory/",
            max_results=500, next_cursor=cursor,
        )
        for r in resp.get("resources", []):
            try:
                if parse(r["created_at"]) < cutoff:
                    old.append(r["public_id"])
            except Exception:
                pass
        cursor = resp.get("next_cursor")
        if not cursor:
            break
    if not old:
        print(f"Cloudinary: nic starsie nez {KEEP_DAYS} dni, netreba mazat.")
        return
    deleted = 0
    for i in range(0, len(old), 100):
        chunk = old[i:i + 100]
        cloudinary.api.delete_resources(chunk, resource_type="video")
        deleted += len(chunk)
    print(f"Cloudinary: zmazanych {deleted} starych videi (> {KEEP_DAYS} dni).")


if __name__ == "__main__":
    main()
