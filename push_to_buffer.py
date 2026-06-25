#!/usr/bin/env python3
"""
Auto-poster (beží aj bezo mňa, cez buffer_token): hotove videa z output/ -> Buffer fronta.

Tok:
  1) video MP4 -> Cloudinary (verejna HTTPS URL; Buffer API nezvlada upload suboru)
  2) Buffer createPost (mode addToQueue, schedulingType automatic) na vsetky pripojene kanaly
     s per-platform metadatami (IG reel, YT title+categoryId, TikTok title)
  3) pamata si odoslane videa v pushed.json (ziadne duplicity)

Pouzitie:
  python push_to_buffer.py            # posle 3 najstarsie nezaradene videa
  python push_to_buffer.py 3          # posle 3
  python push_to_buffer.py --dry-run  # iba overi token + kanaly, nic neposle
"""
import json
import os
import sys

import requests

ROOT = os.path.dirname(os.path.abspath(__file__))
BUFFER_API = "https://api.buffer.com"
PUSHED = os.path.join(ROOT, "pushed.json")
WANT_SERVICES = {"instagram", "tiktok", "youtube"}
YT_CATEGORY = "27"  # Education


def load_cfg():
    import appconfig
    return appconfig.load()


def gql(token, query, variables=None):
    r = requests.post(
        BUFFER_API,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={"query": query, "variables": variables or {}},
        timeout=60,
    )
    data = r.json()
    if "errors" in data:
        raise RuntimeError(json.dumps(data["errors"], indent=2))
    return data["data"]


def get_channels(token):
    q = """
    query { account { organizations { id channels { id name service } } } }"""
    data = gql(token, q)
    chans = []
    for org in data["account"]["organizations"]:
        chans.extend(org.get("channels", []))
    return chans


def upload_cloudinary(cfg, path):
    import cloudinary
    import cloudinary.uploader
    cloudinary.config(
        cloud_name=cfg["cloudinary_cloud_name"],
        api_key=cfg["cloudinary_api_key"],
        api_secret=cfg["cloudinary_api_secret"],
        secure=True,
    )
    public_id = os.path.splitext(os.path.basename(path))[0]
    res = cloudinary.uploader.upload_large(
        path, resource_type="video", folder="facelessfactory",
        public_id=public_id, use_filename=True, unique_filename=False, overwrite=True,
    )
    return res["secure_url"]


def build_mutation(service):
    """Vrati (query, pouziva_title). Metadata su inline (enumy bez uvodzoviek)."""
    if service == "instagram":
        meta = "metadata: { instagram: { type: reel, shouldShareToFeed: true } }"
        decl = "$channelId: ChannelId!, $text: String!, $url: String!"
        use_title = False
    elif service == "youtube":
        meta = f'metadata: {{ youtube: {{ title: $title, categoryId: "{YT_CATEGORY}", privacy: public }} }}'
        decl = "$channelId: ChannelId!, $text: String!, $url: String!, $title: String!"
        use_title = True
    elif service == "tiktok":
        meta = "metadata: { tiktok: { title: $title } }"
        decl = "$channelId: ChannelId!, $text: String!, $url: String!, $title: String!"
        use_title = True
    else:
        meta = ""
        decl = "$channelId: ChannelId!, $text: String!, $url: String!"
        use_title = False
    q = f"""
    mutation({decl}) {{
      createPost(input: {{
        channelId: $channelId,
        text: $text,
        schedulingType: automatic,
        mode: addToQueue,
        assets: [{{ video: {{ url: $url }} }}],
        {meta}
      }}) {{
        ... on PostActionSuccess {{ post {{ id }} }}
        ... on MutationError {{ message }}
      }}
    }}"""
    return q, use_title


def read_txt(txt_path):
    if not os.path.exists(txt_path):
        return "", ""
    lines = open(txt_path, encoding="utf-8").read().split("\n")
    title = lines[0].strip() if lines else ""
    body = "\n".join(lines[1:]).strip()
    return title, body[:2000]


def main():
    args = sys.argv[1:]
    dry = "--dry-run" in args
    nums = [a for a in args if a.isdigit()]
    n = int(nums[0]) if nums else 3

    cfg = load_cfg()
    token = cfg.get("buffer_token", "").strip()
    if not token:
        print("CHYBA: chyba 'buffer_token' v config.json"); return
    for k in ("cloudinary_cloud_name", "cloudinary_api_key", "cloudinary_api_secret"):
        if not cfg.get(k):
            print(f"CHYBA: chyba '{k}' v config.json"); return

    # ID kanalov beru z configu (osobny token nema pravo listovat kanaly cez account-query)
    targets = cfg.get("buffer_channels") or []
    if not targets:
        chans = get_channels(token)
        targets = [c for c in chans if c.get("service", "").lower() in WANT_SERVICES]
    print("Kanaly: " + (", ".join(f"{c['service']}({c.get('name','')})" for c in targets) or "(ziadne)"))
    if not targets:
        print("CHYBA: ziadne kanaly v configu (buffer_channels)."); return

    pushed = json.load(open(PUSHED, encoding="utf-8")) if os.path.exists(PUSHED) else []
    out_dir = os.path.join(ROOT, "output")
    videos = sorted(f for f in os.listdir(out_dir) if f.endswith(".mp4") and f not in pushed)
    todo = videos[:n]
    if not todo:
        print("Ziadne nove videa na odoslanie."); return
    print(f"Na odoslanie: {len(todo)} videi -> {len(targets)} kanalov.")

    if dry:
        for v in todo:
            print(f"  (dry-run) {v}")
        return

    for vid in todo:
        mp4 = os.path.join(out_dir, vid)
        title, body = read_txt(mp4[:-4] + ".txt")
        title = title or "Daily Facts"
        yt_title = (title + " #shorts")[:100]
        print(f"\n=== {vid} ===\n  nahravam na Cloudinary...")
        url = upload_cloudinary(cfg, mp4)
        ok = 0
        for c in targets:
            q, use_title = build_mutation(c["service"].lower())
            v = {"channelId": c["id"], "text": body, "url": url}
            if use_title:
                v["title"] = yt_title if c["service"].lower() == "youtube" else title
            try:
                res = gql(token, q, v)["createPost"]
                if res.get("message"):
                    print(f"  [{c['service']}] CHYBA: {res['message']}")
                else:
                    ok += 1
                    print(f"  [{c['service']}] do fronty OK")
            except Exception as e:
                print(f"  [{c['service']}] CHYBA: {e}")
        if ok:
            pushed.append(vid)
            json.dump(pushed, open(PUSHED, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

    print(f"\nHOTOVO. Odoslane videa: {len([v for v in todo if v in pushed])}/{len(todo)}")


if __name__ == "__main__":
    main()
