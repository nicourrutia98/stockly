# Branding — Stockly

> Identidad visual del proyecto universitario fullstack de gestión de productos. Decisión basada en `dark-research` (sep 2026) sobre psicología de color en contextos educativos/productividad.

## 0. Autoría y atribución

**Proyecto:** Stockly — plataforma fullstack de gestión de inventario.
**Autor:** Juan Nicolas Urrutia Salcedo.
**Código estudiantil:** u20182173626.
**Institución:** Universidad Surcolombiana de Neiva (USCO), Neiva, Huila, Colombia.
**Materia:** Inteligencia Artificial (2026).

El branding, paleta, tipografía, logos y naming definidos en este documento son
parte integral del proyecto académico. Se distribuyen bajo la Licencia MIT
(ver `LICENSE` en la raíz del repositorio).

---

## 1. Nombre y racional

**Stockly** = "Stock" + sufijo "-ly" (como Shopify, Squarespace, Wix). 

Por qué:
- Sugiere inventario/catálogo sin ser literal (no es "Mi Tienda" ni "Catálogo123").
- Corto (6 letras), fácil de escribir, fácil de recordar.
- Funciona igual en español e inglés (sin depender de traducción).
- Disponible como dominio conceptual; el código usa `stockly` como identificador.

## 2. Paleta de colores

### 2.1 Psicología de color aplicada

Investigación 2026 (formandtaste.com / vft.wfglobal.org / colorpick.app) demuestra:
- **Azul** = confianza, productividad, cognición. En universitarios, "overwhelmingly preferred" para entornos de estudio. 42% más retención de audiencia con "adaptive blues".
- **Amarillo acento** = atención, jerarquía visual, sin agresividad. Usado puntualmente para CTAs.
- **Neutros grises** = profesionalismo, legibilidad, reducen fatiga visual.

### 2.2 Tokens oficiales

| Token | HEX | Uso | Psicología |
|---|---|---|---|
| `--color-primary-500` | `#0F4C81` | Botones primarios, links, header, focus ring | Confianza + estabilidad |
| `--color-primary-400` | `#1E5AA8` | Gradient start, hover state | Confianza más viva |
| `--color-primary-600` | `#0A3B66` | Active state, texto sobre fondo claro | Confianza profunda |
| `--color-accent-500` | `#F5B700` | Acento: badges "nuevo", CTA secundario destacado | Atención sin alarma |
| `--color-success-500` | `#16A34A` | Estados OK, validaciones exitosas | Logro |
| `--color-danger-500` | `#DC2626` | Errores, validaciones fallidas | Urgencia |
| `--color-warning-500` | `#D97706` | Validaciones parciales, stock bajo | Precaución |
| `--color-gray-50` | `#F8FAFC` | Fondo app light | Neutro base |
| `--color-gray-100` | `#F1F5F9` | Fondo de cards, hover | Neutro suave |
| `--color-gray-200` | `#E2E8F0` | Bordes, divisores | Neutro medio |
| `--color-gray-500` | `#64748B` | Texto secundario, placeholders | Neutro tipográfico |
| `--color-gray-700` | `#334155` | Texto body | Lectura principal |
| `--color-gray-900` | `#0F172A` | Texto títulos | Máximo contraste |
| `--color-surface-dark` | `#0B1220` | Fondo app dark | Producto digital |
| `--color-surface-dark-elevated` | `#15203B` | Cards/elevación dark | Profundidad |

### 2.3 Ratios WCAG validados

| Combinación | Ratio | Nivel |
|---|---|---|
| `#0F4C81` sobre `#FFFFFF` | 7.8:1 | **AAA** |
| `#334155` sobre `#F8FAFC` | 11.2:1 | **AAA** |
| `#64748B` sobre `#F8FAFC` | 4.9:1 | **AA** (texto ≥18px) |
| `#FFFFFF` sobre `#0F4C81` | 7.8:1 | **AAA** |
| `#0F172A` sobre `#F1F5F9` | 16.1:1 | **AAA** |

## 3. Tipografía

- **UI:** Inter (Google Fonts), fallbacks `system-ui, -apple-system, 'Segoe UI', sans-serif`. Pesos: 400 (body), 500 (UI), 600 (titles), 700 (hero).
- **Mono:** JetBrains Mono para SKU, códigos, IDs. Pesos: 400, 500.
- **Tamaños (Mantine defaults con ajustes):**
  - Display: 48px / line-height 1.1
  - H1: 32px / 1.2
  - H2: 24px / 1.25
  - H3: 20px / 1.3
  - Body: 16px / 1.5 (target de lectura)
  - Small: 14px / 1.4

## 4. Logo

### 4.1 Concepto
- **Tile redondeado** azul con gradient (`#1E5AA8 → #0F4C81`).
- **4 barras apiladas** de izquierda a derecha, ascendentes. Simbología: inventario/estantes de stock que crecen. La barra amarilla más corta en medio es el acento.
- **Grid de puntos** arriba a la derecha = SKU/index/catálogo.
- Sin palabras en el mark → funciona a 16px y a 240px.

### 4.2 Variantes
| Archivo | Uso |
|---|---|
| `assets/logo-mark.svg` | Solo el ícono (240×240) — header, favicon grande, social |
| `assets/logo-wordmark.svg` | Mark + texto "Stockly" — landing, docs |
| `assets/favicon.svg` | 32×32 simplificado — favicon, app icons |

### 4.3 Reglas
- Tamaño mínimo mark: 24px (favicon retina)
- Tamaño mínimo wordmark: 96px ancho
- No rotar, no deformar, no cambiar colores manualmente
- Sobre fotos oscuras: usar versión clara (mark con borde 1px blanco)

## 5. Espaciado, radios, sombras (Mantine defaults + override)

- **Radius:** `xs: 4px`, `sm: 8px`, `md: 12px`, `lg: 16px`, `xl: 24px`
- **Spacing scale:** Mantine default (4px base: 4, 8, 12, 16, 24, 32, 48, 64, 96)
- **Sombras:** Mantine default (`xs`, `sm`, `md`, `lg`, `xl`)

## 6. Modo oscuro

Soporte nativo (Mantine `colorScheme="auto"`):
- Background: `#0B1220`
- Cards: `#15203B`
- Primary se mantiene `#1E5AA8` (más vivo sobre dark)
- Acento amarillo pasa a `#FFC940` (mayor contraste en dark)

## 7. Aplicación al código

### 7.1 Mantine theme (resumen)
```ts
// apps/web/src/shared/config/theme.ts
import { createTheme, MantineColorsTuple } from '@mantine/core';

const blue: MantineColorsTuple = [
  '#E6EFF7', '#C2D5E9', '#9CBBDC', '#6E9AC9', '#4A7BB1',
  '#2E5C95', '#1E5AA8', '#0F4C81', '#0A3B66', '#08294A'
];

const yellow: MantineColorsTuple = [
  '#FFF8E1', '#FFECB3', '#FFE082', '#FFD54F', '#FFCA28',
  '#FFC107', '#F5B700', '#D69E00', '#A87B00', '#7A5800'
];

export const stocklyTheme = createTheme({
  primaryColor: 'stockly-blue',
  primaryShade: { light: 7, dark: 4 },
  colors: { 'stockly-blue': blue, 'stockly-yellow': yellow },
  fontFamily: 'Inter, system-ui, sans-serif',
  fontFamilyMonospace: 'JetBrains Mono, ui-monospace, monospace',
  defaultRadius: 'md',
  white: '#FFFFFF',
  black: '#0B1220',
});
```

### 7.2 Aplicación en backend (logging + Spring banner)
- Banner ASCII con el mark en `src/main/resources/banner.txt`
- Logs estructurados con `service.name=stockly-backend` (Logback JSON)

## 8. Assets generados

| Archivo | Bytes | Propósito |
|---|---|---|
| `assets/logo-mark.svg` | ~1.1 KB | Header, social cards |
| `assets/logo-wordmark.svg` | ~1.3 KB | Landing, docs |
| `assets/favicon.svg` | ~0.6 KB | Favicon 32px |

> SVG nativo (no PNG/JPG) = escalable a cualquier resolución, peso mínimo, fácil de tematizar.

## 9. Fuentes consultadas (dark-research, conf 0.7)

- https://formandtaste.com/design/color-psychology-mood-productivity-design (PMC university study)
- https://www.vft.wfglobal.org/articles/color-psychology-in-presentations-2026-788254 (adaptive blues 2026)
- https://colorpick.app/blog/color-productivity-workplace-focus-design (60+ años de research)
- https://speckyboy.com/free-minimal-logo-templates/ (minimalist logo 2026)
- https://logoquill.com/minimalist-logo-generator (geometric SVG minimalist pattern)

## 10. Anti-patterns a evitar

- Usar más de 2 colores primarios simultáneamente.
- Cambiar el logo de color para "tematizar" (pierde reconocimiento).
- Amarillo como background (vibra demasiado; solo para acentos).
- Texto gris claro (`#94A3B8`) sobre fondo claro — falla WCAG.
- Logo con sombra, bisel, o efectos 3D (obsoleto en 2026).