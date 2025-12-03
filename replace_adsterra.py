import os

old_code = """<script>
(function(krqg){
var d = document,
    s = d.createElement('script'),
    l = d.scripts[d.scripts.length - 1];
s.settings = krqg || {};
s.src = "\/\/weepylack.com\/bUX-Vms.dJG\/l\/0wYbWLcl\/TeTmI9cuaZ\/UPl\/kSPLTwYR2SODTuUlzZNJzsYotyNBjxY\/5ENdTfM\/3sNiww";
s.async = true;
s.referrerPolicy = 'no-referrer-when-downgrade';
l.parentNode.insertBefore(s, l);
})({})
</script>"""

new_code = """<script>
(function(jdby){
var d = document,
    s = d.createElement('script'),
    l = d.scripts[d.scripts.length - 1];
s.settings = jdby || {};
s.src = "\/\/scrawny-affair.com\/bbX.VgskdlGnlA0WYVWEc-\/Pe\/mS9_ucZ\/UJlOk\/PJTwYf2GObTSU\/zYN\/z\/YythN\/jSYf5HN\/TEMb3BN\/wq";
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
