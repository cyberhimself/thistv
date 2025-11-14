import requests
from bs4 import BeautifulSoup

def get_imdb_poster_url(imdb_id: str) -> str:
    """
    Returns the IMDb poster URL for a given IMDb ID.
    Example: imdb_id = "tt0360486"
    """
    url = f"https://www.imdb.com/title/{imdb_id}/"
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        )
    }

    response = requests.get(url, headers=headers)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")

    # --- Method 1: Using meta og:image (most reliable) ---
    meta_tag = soup.find("meta", property="og:image")
    if meta_tag and meta_tag.get("content"):
        return meta_tag["content"]

    # --- Method 2: Hero poster section ---
    hero = soup.find(attrs={"data-testid": "hero-media__poster"})
    if hero:
        img = hero.find("img")
        if img and img.get("src"):
            return img["src"]

    # --- Method 3: Fallback to first poster image ---
    img_tag = soup.find("img", class_="ipc-image")
    if img_tag and img_tag.get("src"):
        return img_tag["src"]

    return None


if __name__ == "__main__":
    imdb_id = "tt0109686"  # Example IMDb ID
    poster_url = get_imdb_poster_url(imdb_id)
    if poster_url:
        print("✅ Poster URL:", poster_url)
    else:
        print("❌ Poster not found.")
