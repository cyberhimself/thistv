import os

old_code = """<script>
(function(qvsayd){
var d = document,
    s = d.createElement('script'),
    l = d.scripts[d.scripts.length - 1];
s.settings = qvsayd || {};
s.src = "\/\/weepylack.com\/bnX\/V\/sFd.GRlG0_YDWvcj\/jeUma9AuwZ\/UxlFkePiTaYx2\/OEDtkn0MMWDCEBttNIj\/Y\/4QOZTAQCwYMhgg";
s.async = true;
s.referrerPolicy = 'no-referrer-when-downgrade';
l.parentNode.insertBefore(s, l);
})({})
</script>"""

new_code = """<script>
(function(jlup){
var d = document,
    s = d.createElement('script'),
    l = d.scripts[d.scripts.length - 1];
s.settings = jlup || {};
s.src = "\/\/scrawny-affair.com\/b.XjV\/sUdYGlli0HYPWqcC\/gecmj9SuYZJUslWk\/PuT_Y\/2qOIDvkm0bMuDvEwtmNRjZYq4aONTjQTwAM\/gn";
s.async = true;
s.referrerPolicy = 'no-referrer-when-downgrade';
l.parentNode.insertBefore(s, l);
})({})
</script>"""

# Folder to scan (current folder)
root_folder = "."

for subdir, dirs, files in os.walk(root_folder):
    for filename in files:
        if filename.lower().endswith(".html"):
            filepath = os.path.join(subdir, filename)

            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()

            if old_code in content:
                content = content.replace(old_code, new_code)

                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(content)

                print(f"Updated: {filepath}")
            else:
                print(f"Skipped (no match): {filepath}")
