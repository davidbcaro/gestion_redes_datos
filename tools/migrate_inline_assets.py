# -*- coding: utf-8 -*-
"""Migra <style> y <script> inline a css/ y js/; usa theme-init.js común en el <head>."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENC = "utf-8"

STYLE_RE = re.compile(r"<style>([\s\S]*?)</style>", re.IGNORECASE)

# No capturar \s* antes de <script> para no eliminar el salto de línea del <meta> anterior
THEME_RE = re.compile(
    r"<script>\s*\(function\s*\(\)\s*\{[\s\S]*?sena-site-theme[\s\S]*?\}\)\(\);\s*</script>\s*",
    re.DOTALL,
)


def write_theme_init():
    t = r"""(function () {
  var t = null;
  try { t = localStorage.getItem("sena-site-theme") || localStorage.getItem("sena-index-theme"); } catch (e) {}
  var d = document.documentElement.getAttribute("data-default-theme");
  if (d !== "light" && d !== "dark") d = "dark";
  document.documentElement.setAttribute("data-theme", t === "light" || t === "dark" ? t : d);
})();"""
    (ROOT / "js" / "theme-init.js").write_text(t + "\n", encoding=ENC)


def replace_theme_script(html: str) -> str:
    if "theme-init.js" in html:
        return html
    m = THEME_RE.search(html)
    if not m:
        raise ValueError("theme init script not found")
    return html[: m.start()] + '  <script src="./js/theme-init.js"></script>\n' + html[m.end() :]


def extract_style_to_css(html: str, css_relpath: str, link_indent: str = "") -> str:
    m = STYLE_RE.search(html)
    if not m:
        raise ValueError("No <style> block found")
    css = m.group(1).strip() + "\n"
    (ROOT / css_relpath).parent.mkdir(parents=True, exist_ok=True)
    (ROOT / css_relpath).write_text(css, encoding=ENC)
    tag = f'{link_indent}<link rel="stylesheet" href="./{css_relpath}">'
    return STYLE_RE.sub(tag, html, count=1)


def extract_page_script_after_theme(html: str, js_relpath: str) -> str:
    """Extrae el <script> inline inmediatamente después de site-theme.js"""
    m = re.search(
        r'(<script src="\./js/site-theme\.js" defer></script>)\s*<script>([\s\S]*?)</script>(\s*</body>)',
        html,
    )
    if not m:
        raise ValueError("No inline script after site-theme.js / bad structure")
    body = m.group(2).strip() + "\n"
    (ROOT / js_relpath).parent.mkdir(parents=True, exist_ok=True)
    (ROOT / js_relpath).write_text(body, encoding=ENC)
    return (
        html[: m.start()]
        + m.group(1)
        + f'\n<script src="./{js_relpath}" defer></script>'
        + m.group(3)
        + html[m.end() :]
    )


def run():
    write_theme_init()

    # index: solo reemplaza tema
    p = ROOT / "index.html"
    t = p.read_text(encoding=ENC)
    t2 = replace_theme_script(t)
    p.write_text(t2, encoding=ENC)
    print("index.html: theme -> theme-init.js")

    # ga4: estilo; tema
    p = ROOT / "ga4-packet-tracer.html"
    t = p.read_text(encoding=ENC)
    t = replace_theme_script(t)
    t = extract_style_to_css(t, "css/ga4-packet-tracer.css", link_indent="  ")
    p.write_text(t, encoding=ENC)
    print("ga4-packet-tracer.html -> css, theme")

    for html_name, js_name in [
        ("revision-direccionamiento-ip.html", "js/revision-direccionamiento-ip.js"),
        ("analizador-grd.html", "js/analizador-grd.js"),
        ("analizador-tema-claro.html", "js/analizador-tema-claro.js"),
        ("analizador-tema-oscuro.html", "js/analizador-tema-oscuro.js"),
    ]:
        p = ROOT / html_name
        t = p.read_text(encoding=ENC)
        t = replace_theme_script(t)
        css = "css/" + html_name.replace(".html", ".css")
        t = extract_style_to_css(t, css)
        t = extract_page_script_after_theme(t, js_name)
        p.write_text(t, encoding=ENC)
        print(f"{html_name} -> {css}, {js_name}")


if __name__ == "__main__":
    run()
