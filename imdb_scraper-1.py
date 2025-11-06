import requests
from bs4 import BeautifulSoup
import re
import os

def get_imdb_poster_url(imdb_id: str, target_height: int = 562, max_size_kb: int = 100, download: bool = False):
    """
    Fetches the IMDb poster URL (Amazon-hosted), prioritizes '_V1_QL50_UY***' pattern,
    and ensures the final image size is under max_size_kb.
    """
    imdb_url = f"https://www.imdb.com/title/{imdb_id}/"
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept-Language": "en-US,en;q=0.5"
    }

    resp = requests.get(imdb_url, headers=headers)
    if resp.status_code != 200:
        print(f"❌ Failed to fetch IMDb page: {resp.status_code}")
        return None

    html = resp.text

    # 🔍 Extract all Amazon poster URLs
    amazon_imgs = re.findall(r"https://m\.media-amazon\.com/images/[^\s\"']+\.jpg", html)
    amazon_imgs = [u for u in amazon_imgs if "_V1_" in u and "UY" in u]

    if not amazon_imgs:
        print(f"❌ No Amazon image URLs found for {imdb_id}")
        return None

    # Pick the one with height closest to target
    def get_height(u):
        m = re.search(r"UY(\d+)", u)
        return int(m.group(1)) if m else 0

    amazon_imgs.sort(key=lambda u: abs(get_height(u) - target_height))
    poster_url = amazon_imgs[0]

    # 🧠 Normalize URL to QL50 and desired UY size
    poster_url = re.sub(r"UY\d+", f"UY{target_height}", poster_url)
    poster_url = re.sub(r"QL\d+", "QL50", poster_url)  # set base quality

    # 🧪 Check size and reduce QL if needed
    ql_value = 50
    while True:
        head = requests.head(poster_url, headers=headers)
        size_kb = int(head.headers.get("Content-Length", 0)) / 1024

        if size_kb == 0:
            # fallback if HEAD doesn't return size
            r = requests.get(poster_url, headers=headers, stream=True)
            size_kb = int(r.headers.get("Content-Length", 0)) / 1024
            r.close()

        if size_kb <= max_size_kb or ql_value <= 10:
            print(f"✅ Using {poster_url} ({size_kb:.1f} KB)")
            break
        else:
            ql_value -= 10
            poster_url = re.sub(r"QL\d+", f"QL{ql_value}", poster_url)
            print(f"⚙️  Reducing quality to QL{ql_value} ({size_kb:.1f} KB > {max_size_kb} KB)")

    # 🖼️ Optionally download image
    if download:
        img_data = requests.get(poster_url, headers=headers).content
        file_path = f"{imdb_id}.jpg"
        with open(file_path, "wb") as f:
            f.write(img_data)
        print(f"📁 Saved as {file_path} ({len(img_data)/1024:.1f} KB)")

    return poster_url


if __name__ == "__main__":
    imdb_id = input("Enter IMDb ID (e.g. tt4154796): ").strip()
    url = get_imdb_poster_url(imdb_id)
    if url:
        print(f"\nFinal Poster URL:\n{url}\n")
