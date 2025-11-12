#!/usr/bin/env python3
"""
replace_origin_url.py

Recursively scans all HTML, JS, and XML files in the project and replaces every occurrence of the old
website origin URL with the new one — including inside SEO/meta tags, canonical links,
open graph tags, structured data, inline scripts, and sitemaps.

Usage:
    python replace_origin_url.py [project_path] [--no-backup] [--dry-run]

Examples:
    python replace_origin_url.py .
    python replace_origin_url.py /path/to/project --no-backup
    python replace_origin_url.py /path/to/project --dry-run

Behavior:
 - Scans files with .html, .htm, .js, and .xml extensions
 - Replaces **all occurrences** of the old URL (in any context) with the new URL
 - Skips files with no matches
 - Creates a .bak backup of modified files by default
 - Dry-run mode allows you to preview changes without modifying files
 - Reports a summary at the end
"""

import argparse
import os
import re
import shutil
import sys
from pathlib import Path

SCAN_EXTS = {'.html', '.htm', '.js', '.xml'}

OLD_URL = "https://cyberhimself.github.io/thistv.movies"
NEW_URL = "https://thistv.linkpc.net"

# Escape old URL for regex search (exact match)
PATTERN = re.compile(re.escape(OLD_URL), re.IGNORECASE)

def replace_url_in_file(path: Path, make_backup: bool = True, dry_run: bool = False) -> int:
    text = path.read_text(encoding='utf-8', errors='replace')
    matches = list(PATTERN.finditer(text))
    if not matches:
        return 0

    new_text, nsubs = PATTERN.subn(NEW_URL, text)

    if nsubs > 0 and not dry_run:
        if make_backup:
            bak_path = path.with_suffix(path.suffix + '.bak')
            counter = 1
            while bak_path.exists():
                bak_path = path.with_suffix(path.suffix + f'.bak{counter}')
                counter += 1
            shutil.copy2(path, bak_path)
        path.write_text(new_text, encoding='utf-8')

    return nsubs

def walk_and_replace(root: Path, make_backup: bool = True, dry_run: bool = False):
    files_changed = []
    files_skipped = []
    total_replacements = 0

    for dirpath, _, filenames in os.walk(root):
        for fname in filenames:
            _, ext = os.path.splitext(fname)
            if ext.lower() not in SCAN_EXTS:
                continue
            fullpath = Path(dirpath) / fname
            try:
                n = replace_url_in_file(fullpath, make_backup=make_backup, dry_run=dry_run)
            except Exception as e:
                print(f"Error processing {fullpath}: {e}")
                continue
            if n > 0:
                files_changed.append((str(fullpath), n))
                total_replacements += n
            else:
                files_skipped.append(str(fullpath))

    return files_changed, files_skipped, total_replacements

def main():
    parser = argparse.ArgumentParser(description='Replace website origin URL in HTML, JS, and XML files.')
    parser.add_argument('path', nargs='?', default='.', help='Project root path (default: current directory)')
    parser.add_argument('--no-backup', action='store_true', help="Do not create .bak backup files")
    parser.add_argument('--dry-run', action='store_true', help='Preview changes without modifying files')
    args = parser.parse_args()

    root = Path(args.path).resolve()
    if not root.exists():
        print(f"Path not found: {root}")
        sys.exit(2)

    print(f"Scanning: {root}")
    if args.dry_run:
        print("[DRY RUN] No files will be modified.")

    files_changed, files_skipped, total_replacements = walk_and_replace(
        root,
        make_backup=not args.no_backup,
        dry_run=args.dry_run
    )

    print('\nSummary:')
    print('--------')
    print(f'Total files scanned: {len(files_changed) + len(files_skipped)}')
    print(f'Files modified: {len(files_changed)}')
    if files_changed:
        for fp, n in files_changed:
            print(f"  - {fp}: {n} replacement(s)")
    print(f'Files skipped (no match): {len(files_skipped)}')
    print(f'Total replacements made: {total_replacements}')

    if total_replacements == 0:
        print('\nNo occurrences of the old URL were found. No files were modified.')

if __name__ == '__main__':
    main()