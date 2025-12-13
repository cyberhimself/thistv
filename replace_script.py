import os

# Define the old and new domains
old_domain = "new9.gdflix.net"
new_domain = "new10.gdflix.net"

# Traverse through all directories and files
for root, dirs, files in os.walk("."):
    for filename in files:
        if filename.lower().endswith(".html"):
            filepath = os.path.join(root, filename)

            # Read file content
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()

            # Replace all instances of the old domain
            if old_domain in content:
                updated_content = content.replace(old_domain, new_domain)

                # Write updated content back to file
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(updated_content)

                print(f"✅ Updated domain in: {filepath}")
            else:
                print(f"— No change needed in: {filepath}")
