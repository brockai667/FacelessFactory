# -*- coding: utf-8 -*-
"""Kontrola Buffer tokenu bez publikovania (CI: publish=check). Token cita len z env BUFFER_TOKEN, nikdy ho nevypisuje."""
import os
import sys

import requests

tok = os.environ.get("BUFFER_TOKEN", "").strip()
if not tok:
    print("BUFFER_TOKEN chyba"); sys.exit(1)
r = requests.post("https://api.buffer.com/graphql", timeout=30, headers={"Authorization": f"Bearer {tok}"},
                  json={"query": "query { account { id organizations { id name } } }"})
try:
    acc = r.json()["data"]["account"]
    orgs = ", ".join(o.get("name") or o["id"] for o in acc.get("organizations", []))
    print(f"Buffer OK: ucet {acc['id'][:6]}… | organizacie: {orgs}")
except Exception:
    print(f"Buffer CHYBA {r.status_code}: {r.text[:200]}"); sys.exit(1)
