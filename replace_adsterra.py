import os

old_code = "<script type='text/javascript' src='//intimidatingsideway.com/ac/eb/fc/acebfc9fa5b1cc2b325c4c5449b1809d.js'></script>"

new_code = """<script>
(function(zftz){
var d = document,
    s = d.createElement('script'),
    l = d.scripts[d.scripts.length - 1];
s.settings = zftz || {};
s.src = "//weepylack.com/bwX.VrsNdGGUlR0CYKWwcI/GeTmA9luFZ/UclpkPPBTVYw3mMVT/cowvMKjDA/txNdjLcox/Noz-AcymMSQl";
s.async = true;
s.referrerPolicy = 'no-referrer-when-downgrade';
l.parentNode.insertBefore(s, l);
})({})
</script>
"""

# Folder where your project is located
root = "."

for subdir, dirs, files in os.walk(root):
    for file in files:
        if file.endswith(".html"):
            file_path = os.path.join(subdir, file)

            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            # Skip if the old script is not present
            if old_code not in content:
                continue

            updated = content.replace(old_code, new_code)

            with open(file_path, "w", encoding="utf-8") as f:
                f.write(updated)

            print(f"Updated: {file_path}")

print("Done!")
