# Zapnutie hlasu z počítača pre stránku Diktat hlas (jednorazovo)

Stránka https://claude.ai/artifact/JMFcBx818yHi1kpJcNaA7h číta zhrnutia hlasom z tvojho počítača cez lokálny
MCP server `diktat` (hlas/mcp_server.py, hlas edge-tts). Prepojenie stránky s lokálnym serverom sa dá
nastaviť len z **lokálnej** Claude Code session v aplikácii Claude (z cloudovej session to Claude odmietne).

1. `update_diktat.bat` (zaregistruje MCP server do Claude desktop) → **reštartuj aplikáciu Claude**.
2. `hlas_ukazky.bat` → vyber si hlas číslom.
3. V aplikácii Claude otvor **lokálnu** session v priečinku FacelessFactory a vlož tento prompt:

```
Publikuj súbor diktat/hlas/diktat-hlas.html ako artefakt: použi nástroj Artifact s url
https://claude.ai/artifact/JMFcBx818yHi1kpJcNaA7h (najprv ho prečítaj cez action read, potom publish s rovnakým obsahom
ako v súbore) a capabilities {"db": {}, "mcp": {"servers": [{"server": "host:diktat", "tools": ["speak", "stop", "voice"]}]}}.
Favicon a description nemeň. Nič iné nerob.
```

4. Otvor stránku v aplikácii Claude (nie v prehliadači). Pri prvom čítaní povoľ prístup k „diktat“.
   Hore má svietiť „zdroj hlasu: počítač (Lukas)“.

Ak sa stránka otvorí v prehliadači alebo lokálny server nebeží, číta hlas prehliadača (Filip) – nič sa nepokazí.
