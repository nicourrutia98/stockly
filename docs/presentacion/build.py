#!/usr/bin/env python3
"""
Stockly — constructor del deck autocontenido.

Toma `deck.template.html` + `slides/*.html` + los recursos (fuentes, capturas,
logo) y produce UN solo archivo `index.html` con todo embebido en base64.
Se abre con doble clic, funciona sin conexion y se imprime a PDF.

    python3 docs/presentacion/build.py

Volver a construirlo es la forma correcta de cambiar una captura o una lamina:
se edita el parcial y se reejecuta. Nunca se edita `index.html` a mano.
"""
import base64
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parent.parent

FONTS = REPO / "apps/web/app/fonts"
SHOTS = HERE / "assets"
LOGO = REPO / "assets/logo-mark.svg"

# token en el parcial -> recurso
IMG_TOKENS = {
    "{{IMG_01}}": "01-landing.png",
    "{{IMG_02}}": "02-catalogo.png",
    "{{IMG_03}}": "03-catalogo-detalle.png",
    "{{IMG_04}}": "04-cotizacion.png",
    "{{IMG_05}}": "05-login.png",
    "{{IMG_06}}": "06-admin-dashboard.png",
    "{{IMG_07}}": "07-admin-productos.png",
    "{{IMG_08}}": "08-admin-detalhe.png",
    "{{IMG_09}}": "09-about-autores.png",
    "{{IMG_10}}": "10-not-found.png",
}

FONT_TOKENS = [
    ("Inter 400", "inter-400.woff2"),
    ("Inter 500", "inter-500.woff2"),
    ("Inter 600", "inter-600.woff2"),
    ("Inter 700", "inter-700.woff2"),
    ("JetBrains Mono 400", "jetbrains-mono-400.woff2"),
    ("JetBrains Mono 500", "jetbrains-mono-500.woff2"),
]


def b64(path: pathlib.Path) -> str:
    return base64.b64encode(path.read_bytes()).decode("ascii")


def main() -> int:
    tpl = (HERE / "deck.template.html").read_text(encoding="utf-8")

    # --- 1. laminas, en orden de bloque ---
    parts = []
    for name in ("10-producto.html", "20-ingenieria.html", "30-verificacion.html"):
        p = HERE / "slides" / name
        if not p.exists():
            sys.exit(f"falta {p}")
        parts.append(p.read_text(encoding="utf-8"))
    slides = "\n\n".join(parts)
    tpl = tpl.replace("{{SLIDES}}", slides)

    # --- 2. tipografia embebida ---
    faces = []
    for family, fname in FONT_TOKENS:
        f = FONTS / fname
        if not f.exists():
            sys.exit(f"falta fuente {f}")
        faces.append(
            f"@font-face{{font-family:'{family.split()[0]}';"
            f"font-weight:{family.split()[1]};"
            f"font-style:normal;font-display:swap;"
            f"src:url(data:font/woff2;base64,{b64(f)}) format('woff2')}}"
        )
    tpl = tpl.replace("{{FONTS}}", "\n".join(faces))

    # --- 3. logo (el SVG trae width/height propios: hay que escalarlos) ---
    logo = LOGO.read_text(encoding="utf-8").strip()
    logo = re.sub(r'width="\d+"', 'width="44"', logo, count=1)
    logo = re.sub(r'height="\d+"', 'height="44"', logo, count=1)
    tpl = tpl.replace("{{LOGO_MARK}}", f'<span style="display:block">{logo}</span>')

    # --- 4. capturas ---
    used = 0
    for token, fname in IMG_TOKENS.items():
        f = SHOTS / fname
        if not f.exists():
            continue
        if token not in tpl:
            continue
        kb = f.stat().st_size // 1024
        print(f"  embebido {fname:26} {kb:4} KB")
        tpl = tpl.replace(token, f'<img alt="{fname}" src="data:image/png;base64,{b64(f)}" />')
        used += 1

    left = re.findall(r"\{\{[A-Z0-9_]+\}\}", tpl)
    if left:
        sys.exit(f"tokens sin resolver: {sorted(set(left))}")

    out = HERE / "index.html"
    out.write_text(tpl, encoding="utf-8")

    kb = out.stat().st_size // 1024
    n = tpl.count('<section class="slide')
    print(f"\n  {out.relative_to(REPO)}")
    print(f"  {n} laminas · {used} capturas · {kb} KB · autocontenido")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())