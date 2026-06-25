#!/usr/bin/env python3
"""Nahra jedno video na Cloudinary a vypise verejnu HTTPS URL.
Pouzitie: python cloud_upload.py output/nazov.mp4
"""
import json
import os
import sys

import cloudinary
import cloudinary.uploader

ROOT = os.path.dirname(os.path.abspath(__file__))
import appconfig
cfg = appconfig.load()
cloudinary.config(
    cloud_name=cfg["cloudinary_cloud_name"],
    api_key=cfg["cloudinary_api_key"],
    api_secret=cfg["cloudinary_api_secret"],
    secure=True,
)

path = sys.argv[1]
public_id = os.path.splitext(os.path.basename(path))[0]
res = cloudinary.uploader.upload_large(
    path, resource_type="video", folder="facelessfactory",
    public_id=public_id, use_filename=True, unique_filename=False, overwrite=True,
)
print(res["secure_url"])
