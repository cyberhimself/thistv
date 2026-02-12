import os

remove_code = """<script
  type="text/javascript"
  src="//thinnerwithdrewforbear.com/62/22/f2/6222f2cce59d808691ba1fd0ae7c016f.js"
></script>"""

root_folder = "."  # Current directory

for subdir, dirs, files in os.walk(root_folder):
    for filename in files:
        if filename.lower().endswith(".html"):
            filepath = os.path.join(subdir, filename)

            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()

            if remove_code in content:
                new_content = content.replace(remove_code, "")

                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(new_content)

                print(f"Removed code from: {filepath}")
            else:
                print(f"Skipped (no match found): {filepath}")
