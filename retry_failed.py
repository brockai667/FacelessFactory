#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Auto-retry: znova zaradi chybne Buffer posty (status 'error') a zmaze stare chybne zaznamy.
Bezi ako krok v daily.yml po push_to_buffer. Buffer token z config.json/ENV (appconfig)."""
import json, time
import requests
import appconfig

URL = "https://api.buffer.com"


def build_mutation(service):
    if service == "instagram":
        meta = "metadata: { instagram: { type: reel, shouldShareToFeed: true } }"
        decl = "$channelId: ChannelId!, $text: String!, $url: String!"; ut = False
    elif service == "youtube":
        meta = 'metadata: { youtube: { title: $title, categoryId: "27", privacy: public } }'
        decl = "$channelId: ChannelId!, $text: String!, $url: String!, $title: String!"; ut = True
    elif service == "tiktok":
        meta = "metadata: { tiktok: { title: $title } }"
        decl = "$channelId: ChannelId!, $text: String!, $url: String!, $title: String!"; ut = True
    else:
        meta = ""; decl = "$channelId: ChannelId!, $text: String!, $url: String!"; ut = False
    q = ("mutation(%s) { createPost(input: { channelId: $channelId, text: $text, "
         "schedulingType: automatic, mode: addToQueue, assets: [{ video: { url: $url } }], %s }) "
         "{ ... on PostActionSuccess { post { id } } ... on MutationError { message } } }" % (decl, meta))
    return q, ut


def title_of(text):
    t = text.split("\n")[0].split(". ")[0].strip()
    return t[:90] or "Daily"


DEL = ("mutation($id: PostId!) { deletePost(input:{id:$id}) "
       "{ __typename ... on VoidMutationError { message } } }")


def main():
    cfg = appconfig.load()
    token = (cfg.get("buffer_token") or "").strip()
    if not token:
        print("retry: chyba buffer_token, koncim."); return
    H = {"Authorization": "Bearer " + token, "Content-Type": "application/json"}

    def gql(q, v=None):
        d = requests.post(URL, headers=H, json={"query": q, "variables": v or {}}, timeout=60).json()
        if "errors" in d:
            raise RuntimeError(json.dumps(d["errors"], ensure_ascii=False)[:300])
        return d["data"]

    try:
        org = gql("query { account { organizations { id } } }")["account"]["organizations"][0]["id"]
        node = "id channelId channelService text assets { ... on VideoAsset { source } }"
        edges = gql('query { posts(input:{organizationId:"%s", filter:{status:[error]}}){ edges { node { %s } } } }' % (org, node))["posts"]["edges"]
    except Exception as e:
        print("retry: Buffer chyba:", str(e)[:160]); return

    if not edges:
        print("retry: ziadne chybne posty."); return
    print("retry: %d chybnych postov, skusam znova..." % len(edges))
    ok = 0
    for e in edges:
        n = e["node"]; svc = n["channelService"]
        src = next((a.get("source") for a in (n.get("assets") or []) if a.get("source")), None)
        if not src:
            print("  [%s] preskakujem (video uz neexistuje)" % svc); continue
        title = title_of(n["text"])
        if svc == "youtube":
            title = (title + " #shorts")[:100]
        q, ut = build_mutation(svc)
        v = {"channelId": n["channelId"], "text": n["text"], "url": src}
        if ut:
            v["title"] = title
        try:
            res = gql(q, v)["createPost"]
            if res.get("message"):
                print("  [%s] createPost chyba: %s" % (svc, res["message"][:100])); continue
            ok += 1
            print("  [%s] znova zaradene OK" % svc)
            try:
                gql(DEL, {"id": n["id"]})
            except Exception:
                pass
        except Exception as ex:
            print("  [%s] chyba: %s" % (svc, str(ex)[:120]))
        time.sleep(1)
    print("retry: hotovo, znova zaradenych %d." % ok)


if __name__ == "__main__":
    main()
