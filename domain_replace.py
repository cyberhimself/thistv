import os

old_domain = "https://new7.gdflix.net"
new_domain = "https://new9.gdflix.net"

def update_domains_in_html(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.lower().endswith(".html"):
                file_path = os.path.join(root, file)

                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()

                if old_domain in content:
                    print(f"Updating: {file_path}")
                    updated_content = content.replace(old_domain, new_domain)

                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(updated_content)

    print("\nDone! All matching domains have been updated.")

# ---- RUN ----
# Replace "." with any folder path you want to scan
update_domains_in_html(".")
