import os
import re

# The code to inject
inject_code = '''<script
  type="text/javascript"
  src="//intimidatingsideway.com/62/22/f2/6222f2cce59d808691ba1fd0ae7c016f.js"
></script>'''

root_folder = "."  # Current directory

for subdir, dirs, files in os.walk(root_folder):
    for filename in files:
        if filename.lower().endswith(".html"):
            filepath = os.path.join(subdir, filename)

            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()

            # Check if <head> exists
            if "<head" not in content.lower():
                print(f"Skipped (no <head> tag): {filepath}")
                continue

            # Avoid inserting twice
            if inject_code in content:
                print(f"Skipped (code already exists): {filepath}")
                continue

            # Inject just before </head>
            new_content = re.sub(
                r"</head>",
                inject_code + "\n</head>",
                content,
                flags=re.IGNORECASE
            )

            if new_content != content:
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(new_content)
                print(f"Injected into: {filepath}")
            else:
                print(f"Skipped (no </head> found): {filepath}")
