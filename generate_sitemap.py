import os
from datetime import datetime
from urllib.parse import urljoin

# ===== CONFIGURATION =====
BASE_URL = "https://thistv.linkpc.net/"  # Change to your domain
ROOT_DIR = "."                          # Website root directory
OUTPUT_FILE = "sitemap.xml"
EXCLUDE_FILES = {"404.html", "error.html"}
# ==========================


def generate_sitemap():
    urls = []

    # Only process files in the main folder (ROOT_DIR), skip subfolders and 'linkpages'
    for file in os.listdir(ROOT_DIR):
        file_path = os.path.join(ROOT_DIR, file)
        # Skip directories and the 'linkpages' folder
        if os.path.isdir(file_path):
            if file == "linkpages":
                continue
            else:
                continue  # skip all subfolders
        if file.endswith(".html") and file not in EXCLUDE_FILES:
            url_path = file.replace(os.sep, "/")
            # Remove index.html from URL
            if url_path.endswith("index.html"):
                url_path = url_path.replace("index.html", "")
            full_url = urljoin(BASE_URL, url_path)
            urls.append(full_url)

    write_sitemap(urls)


def write_sitemap(urls):
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n')
        f.write('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')

        for url in sorted(urls):
            f.write("  <url>\n")
            f.write(f"    <loc>{url}</loc>\n")
            f.write(f"    <lastmod>{datetime.now().date()}</lastmod>\n")
            f.write("    <changefreq>weekly</changefreq>\n")
            f.write("    <priority>0.8</priority>\n")
            f.write("  </url>\n")

        f.write("</urlset>")

    print(f"✅ Sitemap generated: {OUTPUT_FILE}")


if __name__ == "__main__":
    generate_sitemap()
