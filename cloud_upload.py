#!/usr/bin/env python3
"""Nahra jedno video na Cloudinary a vypise verejnu HTTPS URL.
Pouzitie: python cloud_upload.py output/nazov.mp4
"""
import os
import sys

import appconfig
from push_to_buffer import upload_cloudinary


def main():
    if len(sys.argv) < 2:
        print("Pouzitie: python cloud_upload.py output/nazov.mp4")
        sys.exit(1)
    path = sys.argv[1]
    if not os.path.exists(path):
        print(f"CHYBA: subor neexistuje: {path}")
        sys.exit(1)
    cfg = appconfig.load()
    try:
        url = upload_cloudinary(cfg, path)
    except Exception as e:
        print(f"CHYBA: upload na Cloudinary zlyhal: {str(e)[:300]}")
        sys.exit(1)
    print(url)


if __name__ == "__main__":
    main()
