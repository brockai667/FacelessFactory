#!/usr/bin/env python3
"""
Auto-poster (beží aj bezo mňa, cez buffer_token): hotove videa z output/ -> Buffer fronta.

Tok:
  1) video MP4 -> Cloudinary (verejna HTTPS URL; Buffer API nezvlada upload suboru)
  2) Buffer createPost (mode customScheduled na presny cas 08:00/15:00/20:00) na vsetky kanaly
     s per-platform metadatami (IG reel, YT title+categoryId, TikTok title)
  3) pamata si odoslane videa v pushed.json (ziadne duplicity)

Pouzitie:
  python push_to_buffer.py            # posle 3 najstarsie nezaradene videa
  python push_to_buffer.py 3          # posle 3
  python push_to_buffer.py --dry-run  # iba overi token + kanaly, nic neposle
"""
import datetime
import json
import os
import sys
import time

import requests

ROOT = os.path.dirname(os.path.abspath(__file__))
BUFFER_API = "https://api.buffer.com"
PUSHED = os.path.join(ROOT, "pushed.json")
WANT_SERVICES = {"instagram", "tiktok", "youtube"}
YT_CATEGORY = "27"  # Education
SLOT_HOURS = [8, 15, 20]  # presne casy publikovania (Europe/Bratislava)


def next_slots(n):
    """Vrati n najblizsich buducich casov 08:00/15:00/20:00 (Bratislava) ako ISO UTC."""
    try:
        from zoneinfo import ZoneInfo
        tz = ZoneInfo("Europe/Bratislava")
    except Exception:
        tz = datetime.timezone(datetime.timedelta(hours=2))
    now = datetime.datetime.now(tz)
    out, day = [], 0
    while len(out) < n:
        for h in SLOT_HOURS:
            t = (now + datetime.timedelta(days=day)).replace(hour=h, minute=0, second=0, microsecond=0)
            if t > now:
                out.append(t.astimezone(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z"))
                if len(out) >= n:
                    break
        day += 1
    return out


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
    """Vrati (query, pouziva_title). Metadata su inline. Planuje na presny cas cez dueAt + customScheduled."""
    base = "$channelId: ChannelId!, $text: String!, $url: String!, $dueAt: DateTime!"
    if service == "instagram":
        meta = "metadata: { instagram: { type: reel, shouldShareToFeed: true } }"
        decl = base
        use_title = False
    elif service == "youtube":
        meta = f'metadata: {{ youtube: {{ title: $title, categoryId: "{YT_CATEGORY}", privacy: public }} }}'
        decl = base + ", $title: String!"
        use_title = True
    elif service == "tiktok":
        meta = "metadata: { tiktok: { title: $title } }"
        decl = base + ", $title: String!"
        use_title = True
    else:
        meta = ""
        decl = base
        use_title = False
    q = f"""
    mutation({decl}) {{
      createPost(input: {{
        channelId: $channelId,
        text: $text,
        schedulingType: automatic,
        mode: customScheduled,
        dueAt: $dueAt,
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


def load_pushed():
    """Vrati {filename: [sluzby_kde_uz_doslo]}. Migruje staru schemu (zoznam mien)."""
    if not os.path.exists(PUSHED):
        return {}
    data = json.load(open(PUSHED, encoding="utf-8"))
    if isinstance(data, list):
        # stara schema: ber kazde video ako hotove na vsetkych sluzbach (ziadne duplicity)
        return {name: sorted(WANT_SERVICES) for name in data}
    return data


def save_pushed(pushed):
    json.dump(pushed, open(PUSHED, "w", encoding="utf-8"), ensure_ascii=False, indent=2)


def create_post(token, service, channel_id, text, url, title, due):
    """Posle 1 prispevok na 1 kanal naplanovany na presny cas (due); 1x zopakuje. Vrati (ok, sprava)."""
    q, use_title = build_mutation(service)
    v = {"channelId": channel_id, "text": text, "url": url, "dueAt": due}
    if use_title:
        v["title"] = title
    last = ""
    for attempt in range(2):
        try:
            res = gql(token, q, v)["createPost"]
            if res.get("message"):
                last = res["message"]
            else:
                return True, ""
        except Exception as e:
            last = str(e)
        if attempt == 0:
            time.sleep(3)
    return False, last


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

    pushed = load_pushed()
    target_services = {c["service"].lower() for c in targets}
    out_dir = os.path.join(ROOT, "output")
    all_videos = sorted(f for f in os.listdir(out_dir) if f.endswith(".mp4"))
    # video treba spracovat, kym nie je odoslane na VSETKY cielove sluzby
    todo = [v for v in all_videos
            if not target_services.issubset(set(pushed.get(v, [])))][:n]
    if not todo:
        print("Ziadne nove videa na odoslanie."); return
    print(f"Na odoslanie: {len(todo)} videi -> {len(targets)} kanalov.")

    if dry:
        for v in todo:
            pend = [c["service"] for c in targets if c["service"].lower() not in set(pushed.get(v, []))]
            print(f"  (dry-run) {v} -> chyba: {', '.join(pend)}")
        return

    slots = next_slots(len(todo))  # 08:00/15:00/20:00 Bratislava - i-te video -> i-ty slot
    for i, vid in enumerate(todo):
        due = slots[i]
        done = set(pushed.get(vid, []))
        pending = [c for c in targets if c["service"].lower() not in done]
        if not pending:
            continue
        mp4 = os.path.join(out_dir, vid)
        title, body = read_txt(mp4[:-4] + ".txt")
        title = title or "Daily Facts"
        yt_title = (title + " #shorts")[:100]
        print(f"\n=== {vid} ===  (cas {due}; chyba: {', '.join(c['service'] for c in pending)})")
        print("  nahravam na Cloudinary...")
        url = upload_cloudinary(cfg, mp4)
        for c in pending:
            svc = c["service"].lower()
            t = yt_title if svc == "youtube" else title
            ok, msg = create_post(token, svc, c["id"], body, url, t, due)
            if ok:
                done.add(svc)
                pushed[vid] = sorted(done)
                save_pushed(pushed)
                print(f"  [{svc}] do fronty OK")
            else:
                print(f"  [{svc}] CHYBA (skusi sa znova nabuduce): {msg}")

    fully = sum(1 for v in todo if target_services.issubset(set(pushed.get(v, []))))
    print(f"\nHOTOVO. Plne odoslane na vsetky platformy: {fully}/{len(todo)} videi.")


if __name__ == "__main__":
    main()
