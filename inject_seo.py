#!/usr/bin/env python3
import json, re
from pathlib import Path

ROOT = Path(__file__).parent
DATAFILE = ROOT / "data" / "movies.json"
ORIGIN = "https://thistv.linkpc.net"
OVERWRITE_EXISTING = True
# Toggle backup creation (set to True to keep creating .bak files)
BACKUP = False

def load_data():
    with DATAFILE.open('r', encoding='utf-8') as f:
        return json.load(f)

def build_jsonld(item):
    j = {
        "@context": "https://schema.org",
        "@type": "Movie" if item.get('type','movie')=='movie' else "CreativeWork",
        "name": item.get('seo-title','').replace('"',''),
        "image": item.get('poster',''),
        "description": item.get('description',''),
        "datePublished": str(item.get('year','')),
        "genre": item.get('genres',[]),
        "duration": item.get('runtime',''),
    }
    if item.get('trailer'):
        j['trailer'] = {
            "@type":"VideoObject",
            "name": f"{item.get('title','')} Trailer",
            "embedUrl": item.get('trailer')
        }
    return json.dumps(j, indent=2, ensure_ascii=False)

def inject_into_head(html, inject_html):
    m = re.search(r"(</title\s*>)", html, flags=re.I)
    if m:
        pos = m.end()
        return html[:pos] + "\n" + inject_html + html[pos:]
    m2 = re.search(r"(<head[^>]*>)", html, flags=re.I)
    if m2:
        pos = m2.end()
        return html[:pos] + "\n" + inject_html + html[pos:]
    return inject_html + html

def make_meta_tags(item, page_url):
    desc = item.get('description','').strip()
    if len(desc) > 155:
        desc = desc[:152].rsplit(' ',1)[0] + "..."
    meta = []
    meta.append(f'<meta name="description" content="{desc}" />')
    meta.append(f'<link rel="canonical" href="{page_url}" />')
    meta.append(f'<meta property="og:title" content="{item.get("seo-title","")}" />')
    meta.append(f'<meta property="og:description" content="{desc}" />')
    meta.append(f'<meta property="og:image" content="{item.get("poster","")}" />')
    meta.append(f'<meta property="og:url" content="{page_url}" />')
    meta.append(f'<meta property="og:type" content="video.movie" />')
    meta.append(f'<meta name="twitter:card" content="summary_large_image" />')
    meta.append(f'<meta name="twitter:title" content="{item.get("seo-title","")}" />')
    meta.append(f'<meta name="twitter:description" content="{desc}" />')
    meta.append(f'<meta name="twitter:image" content="{item.get("poster","")}" />')
    return "\n".join(meta)

def main():
    data = load_data()
    items = data.get('items', [])
    for it in items:
        link = it.get('link')
        if not link:
            continue
        page = ROOT / link
        if not page.exists():
            print(f"WARNING: page not found for link: {link}")
            continue
        html = page.read_text(encoding='utf-8', errors='ignore')
        if BACKUP:
            bak = page.with_suffix(page.suffix + '.bak')
            bak.write_text(html, encoding='utf-8')
        page_url = ORIGIN.rstrip('/') + '/' + link.lstrip('/')
        meta_tags = make_meta_tags(it, page_url)
        jsonld = build_jsonld(it)
        jsonld_tag = f'<script type="application/ld+json">\n{jsonld}\n</script>'
        inject_html = meta_tags + "\n" + jsonld_tag + "\n"

        # Check if meta description and JSON-LD already exist to avoid duplicate injection
        already_injected = (
            re.search(r'<meta\s+name=["\']description["\']', html, flags=re.I) and
            re.search(r'<script\s+type=["\']application/ld\+json["\']', html, flags=re.I)
        )
        if already_injected:
            print(f"SKIP (already injected): {link}")
            continue

        if not OVERWRITE_EXISTING and re.search(r'<meta\s+name=["\']description["\']', html, flags=re.I):
            print(f"SKIP (meta desc exists): {link}")
            continue

        new_html = inject_into_head(html, inject_html)
        page.write_text(new_html, encoding='utf-8')
        print(f"Updated: {link}")

if __name__ == "__main__":
    main()
