import os
import re

# The meta tag to insert
META_TAG = '<meta name="referrer" content="no-referrer-when-downgrade" />'

def process_html_file(file_path):
    # Read file
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Check for <head> tag
    match = re.search(r"<head[^>]*>", content, re.IGNORECASE)
    if not match:
        print(f"Skipped (no <head>): {file_path}")
        return

    # Skip if meta already exists
    if META_TAG in content:
        print(f"Skipped (already added): {file_path}")
        return

    # Inject meta tag right after <head>
    insert_pos = match.end()
    updated_content = content[:insert_pos] + "\n    " + META_TAG + content[insert_pos:]

    # Write back to file
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(updated_content)

    print(f"Updated: {file_path}")


def scan_directory(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.lower().endswith(".html"):
                process_html_file(os.path.join(root, file))


if __name__ == "__main__":
    # Change "." to another folder path if needed
    scan_directory(".")
