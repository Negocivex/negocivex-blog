"""Genera las imágenes para compartir (1200x630) del blog.

Uso: python3 scripts/og.py            -> crea public/og.png y la de cada artículo que aún no la tenga
     python3 scripts/og.py --todas    -> las regenera todas
Necesita Playwright con Chromium (pip install playwright && playwright install chromium).
"""
import base64, pathlib, re, sys, html
from playwright.sync_api import sync_playwright

RAIZ = pathlib.Path(__file__).resolve().parent.parent
FUENTES = RAIZ / "public" / "fonts"
ICONO = (RAIZ / "public" / "favicon.svg").read_text()

PLANTILLA = """<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{{font-family:"DM Sans";font-weight:500;src:url(data:font/woff2;base64,{f500}) format("woff2")}}
@font-face{{font-family:"DM Sans";font-weight:800;src:url(data:font/woff2;base64,{f800}) format("woff2")}}
html,body{{margin:0}}
body{{width:1200px;height:630px;overflow:hidden;position:relative;font-family:"DM Sans",sans-serif;color:#fff;
 background:linear-gradient(118deg,#141F47 0%,#1B2A5E 40%,#3A3BB8 85%,#5046E5 100%)}}
.top{{position:absolute;left:72px;top:60px;display:flex;align-items:center;gap:14px;font-weight:800;font-size:34px;letter-spacing:-1px}}
.top svg{{width:52px;height:52px;background:#fff;border-radius:14px;padding:8px}}
.top span{{color:#C9C7FF}}
.kicker{{position:absolute;left:72px;top:170px;font-weight:500;font-size:24px;color:rgba(255,255,255,.75);letter-spacing:.06em;text-transform:uppercase}}
h1{{position:absolute;left:72px;right:90px;top:215px;margin:0;font-weight:800;font-size:{tam}px;line-height:1.1;letter-spacing:-1.5px}}
.foot{{position:absolute;left:72px;bottom:56px;font-weight:500;font-size:24px;color:rgba(255,255,255,.8)}}
</style></head><body>
<div class="top">{icono}<div>negoci<span>vex</span></div></div>
<div class="kicker">{kicker}</div>
<h1>{titulo}</h1>
<div class="foot">blog.negocivex.com</div>
</body></html>"""


def fuente(peso):
    return base64.b64encode((FUENTES / f"dm-sans-latin-{peso}-normal.woff2").read_bytes()).decode()


def render(pagina, titulo, kicker, destino):
    tam = 64 if len(titulo) <= 48 else 56 if len(titulo) <= 62 else 50
    doc = PLANTILLA.format(f500=fuente(500), f800=fuente(800), icono=ICONO, titulo=html.escape(titulo), kicker=html.escape(kicker), tam=tam)
    pagina.set_content(doc)
    pagina.evaluate("document.fonts.ready")
    pagina.wait_for_timeout(250)
    pagina.screenshot(path=str(destino), clip={"x": 0, "y": 0, "width": 1200, "height": 630})
    print("OG:", destino.relative_to(RAIZ))


def main():
    todas = "--todas" in sys.argv
    (RAIZ / "public" / "og").mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        nav = p.chromium.launch()
        pagina = nav.new_page(viewport={"width": 1200, "height": 630})
        base = RAIZ / "public" / "og.png"
        if todas or not base.exists():
            render(pagina, "Lo que tus clientes no te dicen", "El blog de Negocivex", base)
        for md in sorted((RAIZ / "posts").glob("*.md")):
            destino = RAIZ / "public" / "og" / f"{md.stem}.png"
            if destino.exists() and not todas:
                continue
            m = re.search(r"^titulo:\s*(.+)$", md.read_text(encoding="utf-8"), re.M)
            if m:
                render(pagina, m.group(1).strip(), "Guía práctica", destino)
        nav.close()


if __name__ == "__main__":
    main()
