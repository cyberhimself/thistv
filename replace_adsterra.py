import os

# -------- CONFIG --------
old_code = "<script type='text/javascript' src='//intimidatingsideway.com/62/22/f2/6222f2cce59d808691ba1fd0ae7c016f.js'></script>"

new_code = """<script>
(function(rpz){
var d = document,
    s = d.createElement('script'),
    l = d.scripts[d.scripts.length - 1];
s.settings = rpz || {};
s.src = "//mediumdirt.com/c.D/9R6/bN2L5_l_SnWSQ/9kNAjqYr4yOsTmMb2jMNyy0Z2aN/j_gY5PM/zxY/0Y";
s.async = true;
s.referrerPolicy = 'no-referrer-when-downgrade';
l.parentNode.insertBefore(s, l);
})({})
</script>"""
# ------------------------


def replace_in_html_files(root_folder="."):
    for root, dirs, files in os.walk(root_folder):
        for file in files:
            if file.lower().endswith(".html"):
                file_path = os.path.join(root, file)

                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()

                if old_code not in content:
                    print(f"⏩ No match found, skipped: {file_path}")
                    continue

                new_content = content.replace(old_code, new_code)

                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(new_content)

                print(f"✔ Updated: {file_path}")


# Run on the current folder
replace_in_html_files(".")
