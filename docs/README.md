# Documentación de Ingeniería — Stockly

> Índice y guía de lectura. Este carpeta es la documentación de ingeniería del
> proyecto: qué se pidió, por qué, cómo se construye, cómo se verifica y qué
> falta.

**Proyecto:** Stockly — plataforma web de gestión de inventario de productos.
**Autores:** Juan Nicolas Urrutia Salcedo (`u20182173626`),
Luisa Maria Jose Coronel Vargas (`u20222208436`) y
Ana Sofía Montaña Cedeño (`u20212200775`) — Universidad Surcolombiana de Neiva,
Materia Inteligencia Artificial, 2026.
**Licencia:** MIT.
**Contrato de ingeniería:** `dark-memory` `spec_id=6` (vibe_case `C1`, 15 tareas,
integrity level 3 según IEEE 1012).

---

## Por dónde empezar

| Si eres… | Lee en este orden |
|---|---|
| **Docente / jurado** que evalúa el proceso | [00 Visión y objetivos](00-vision-y-objetivos.md) → [01 Requisitos](01-requisitos.md) → [03 Calidad y verificación](03-calidad-y-verificacion.md) → [04 Estado y brechas](04-estado-y-brechas.md) |
| **Docente / jurado** que evalúa el resultado | [00 Visión y objetivos](00-vision-y-objetivos.md) → [02 Arquitectura](02-arquitectura.md) → [04 Estado y brechas](04-estado-y-brechas.md) |
| **Revisor de calidad** | [01 Requisitos](01-requisitos.md) → [03 Calidad y verificación](03-calidad-y-verificacion.md) |
| **Alguien que quiera continuar el desarrollo** | [02 Arquitectura](02-arquitectura.md) → [04 Estado y brechas](04-estado-y-brechas.md) → [05 Gestión del proyecto](05-gestion-del-proyecto.md) |
| **Alguien que vaya a desplegar** | [06 Despliegue en producción](06-despliegue-produccion.md) (léase primero §2: por qué el backend no va en Vercel) |

---

## Mapa de documentos

| # | Documento | Qué responde |
|---|---|---|
| 00 | [Visión y objetivos](00-vision-y-objetivos.md) | ¿Qué problema resuelve Stockly? ¿Para quién? ¿Qué se acordó hacer y qué no? ¿Cómo se sabe si se logró? |
| 01 | [Requisitos](01-requisitos.md) | ¿Qué debe hacer el sistema? Catálogo completo de requisitos funcionales, no funcionales y reglas de negocio, con identificadores estables. |
| 02 | [Arquitectura](02-arquitectura.md) | ¿Cómo está construido? Stack, estructura de paquetes, modelo de datos, flujo de sesión, decisiones arquitectónicas y su justificación. |
| 03 | [Calidad y verificación](03-calidad-y-verificacion.md) | ¿Cómo se comprueba que funciona? Estrategia de pruebas, V&V, accesibilidad, seguridad, rendimiento y usabilidad medida. |
| 04 | [Estado y brechas](04-estado-y-brechas.md) | ¿Cuánto hay hecho? Estado real por requisito contra lo especificado, lista de brechas y riesgos abiertos. |
| 05 | [Gestión del proyecto](05-gestion-del-proyecto.md) | ¿Cómo se repartió el trabajo y cómo se gobiernan los cambios? Plan de tareas, gobernanza de desviaciones, riesgos, métricas. |
| 06 | [Despliegue en producción](06-despliegue-produccion.md) | ¿Cómo se publica? Dónde vive cada pieza, variables de entorno, cookies y CORS entre dominios, orden de despliegue, verificación y rollback. |

### Presentación

| Archivo | Qué es |
|---|---|
| [presentacion/index.html](presentacion/index.html) | Deck autocontenido de 16 láminas, 3 ponentes, ~5 min cada uno. Doble clic para abrir; `f` pantalla completa; `p` exportar a PDF. |
| [presentacion/GUION.md](presentacion/GUION.md) | Guion con tiempos lámina por lámina, notas del expositor, preguntas previsibles y listas de verificación. |
| [presentacion/Stockly-presentacion.pdf](presentacion/Stockly-presentacion.pdf) | Copia para entregar o proyectar sin navegador (16 páginas, con las notas al pie). |
| `presentacion/assets/` | Capturas reales de la aplicación usadas en el deck. |
| `presentacion/slides/` | Láminas en HTML. **Se editan aquí y se reconstruye** con `python3 docs/presentacion/build.py`; nunca `index.html` a mano. |

### Documentos anteriores (conservados)

| Documento | Contenido |
|---|---|
| [F1 — Inventario de flujos de usuario](F1-flujos-usuario.md) | 7 flujos verificados contra la aplicación en ejecución, con criterios observables y gaps históricos. |
| [F4 — Protocolo de sesión psicométrica](F4-protocolo-sesion.md) | Guion de medición de usabilidad con instrumentos SUS/SEQ/NASA-TLX y sus umbrales. |
| `apps/web/docs/FE-T1..FE-T4-*.md` | Notas de entrega de cada Incremento de frontend (fundación, autenticación, filtros, detalle). |
| [BRANDING.md](../assets/BRANDING.md) | Paleta, tipografía, logo y reglas visuales con validación WCAG. |

---

## Convenciones

- **Identificadores.** Los requisitos tienen identificador estable (`RF-01`,
  `RNF-02`, `RN-03`). Estos códigos no se renumeran: si un requisito se elimina,
  queda marcado como retirado en vez de renumerar los siguientes. Así la
  trazabilidad con pruebas y con la especificación sigue siendo válida en el
  tiempo.
- **Estados.** `Implementado` = existe en el código y fue verificado en
  ejecución. `Parcial` = existe pero no cumple todo el criterio. `Pendiente` =
  especificado y no implementado. `Retirado` = se descartó explícitamente.
- **Fuentes.** El contrato de ingeniería es `spec_id=6` de `dark-memory`; las
  especificaciones derivadas son `spec_id=11` (frontend), `13` (E2E
  psicométrico), `18` (accesibilidad) y `20` (MVP / tienda pública). Cuando este
  documento y el código discrepan, el código describe lo que existe y la sección
  [04 Estado y brechas](04-estado-y-brechas.md) describe la diferencia.