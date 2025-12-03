import os
import re

# Start from current working directory
root_folder = os.getcwd()

# Regex to match multiple blank lines
blank_lines_pattern = re.compile(r'\n\s*\n+', re.MULTILINE)

for root, _, files in os.walk(root_folder):
    for filename in files:
        if filename.lower().endswith(".html"):
            file_path = os.path.join(root, filename)
            
            with open(file_path, "r", encoding="utf-8") as file:
                content = file.read()

            # 1. Remove multiple consecutive blank lines (keep one)
            cleaned = re.sub(blank_lines_pattern, "\n\n", content)
            
            # 2. Remove trailing spaces/tabs from each line
            cleaned = "\n".join(line.rstrip() for line in cleaned.splitlines())

            # 3. Ensure final newline at end of file
            cleaned = cleaned.rstrip() + "\n"

            # Save only if changed
            if cleaned != content:
                with open(file_path, "w", encoding="utf-8") as file:
                    file.write(cleaned)
                print(f"✅ Cleaned: {file_path}")
            else:
                print(f"⏭️ Already clean: {file_path}")

print("\n🎉 Finished cleaning all HTML files (extra blank lines removed safely).")
