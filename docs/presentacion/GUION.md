# Guion de exposición — Stockly

> 3 ponentes · ~5 minutos cada uno · 16 láminas · idioma español (Colombia).
> Este guion acompaña a `index.html`. Las **notas del expositor** ya están
> embebidas en cada lámina (`<div class="notes">`) y aparecen al imprimir a PDF.

---

## Cómo se usa

| Acción | Cómo |
|---|---|
| Abrir | Doble clic en `index.html`. No necesita internet ni servidor. |
| Avanzar | `→` `espacio` `Enter` · clic en la mitad derecha · deslizar |
| Retroceder | `←` · clic en el tercio izquierdo |
| Pantalla completa | `f` |
| Ir a la primera / última | `Inicio` / `Fin` |
| Exportar a PDF | `p` (o el comando documentado al final) |
| Saber dónde está | La URL cambia a `#7`; se puede compartir un enlace directo |

> El archivo es un único HTML con las fuentes, el logo y las capturas embebidos en
> base64. No hay peticiones de red: se puede presentar sin conexión.

---

## Distribución de tiempo

| Bloque | Ponente | Láminas | Tiempo | Idea que debe quedar |
|---|---|---|---|---|
| Apertura | Juan Nicolas | 1 | 0:00–0:30 | Un inventario que se vende solo, y su documentación honesta. |
| **1 · El producto** | Juan Nicolas | 2–6 | 0:30–5:30 | El problema real, la corrección de rumbo y las dos superficies. |
| **2 · La ingeniería** | Luisa María José | 7–11 | 5:30–10:30 | Stack, decisiones, seguridad y las cifras del sistema. |
| **3 · La verificación** | Ana Sofía | 12–15 | 10:30–14:30 | Qué está verificado, qué no, y el plan en orden. |
| Cierre | Los tres | 16 | 14:30–15:00 | Lo que queremos que se lleven. |

**Regla de los tres bloques:** cada bloque abre con su respuesta y la sostiene con
exactamente tres ideas. La memoria de trabajo sostiene tres elementos; cuatro ya
empiezan a caerse.

---

## Guion lámina por lámina

### 1 · Portada — *Juan Nicolas, 30 s*

> «Un inventario que se vende solo. La tienda es pública, el panel es privado, y lo
> interesting es que detrás hay un contrato de 75 requisitos versionado. Voy a
> contarlo en tres partes: el producto, cómo se construyó, y qué está verificado y
> qué no — porque esa última parte es la que más cuesta decir.»

*Anticipar el bloque 3 quita la sensación de que se está escondiendo algo.*

---

### 2 · Las dos superficies — *Juan Nicolas, 60 s*

> «Esta es la respuesta: un comprador sin cuenta ve el stock real, un operador con
> cuenta lo cambia, y nadie ve lo que no existe. Seis rutas sin sesión, cinco de
> panel. Y fíjense en la disponibilidad: "solo quedan 2", "agotado". Nunca una
> cuenta regresiva ni una escasez inventada.»

*Señalar el catálogo. No leer los tres puntos: nombrarlos.*

### 3 · El problema — *Juan Nicolas, 45 s*

> «Una hoja de cálculo rompe en tres sitios: se vende lo que ya no hay, nadie
> publica los precios, y nadie sabe qué cambió. Stockly ataca los tres con la misma
> tabla: lo que ve el comprador y lo que edita el operador leen el mismo dato.»

*Quedarse en la tercera tarjeta: conecta con la auditoría del bloque 2.*

### 4 · La corrección de rumbo — *Juan Nicolas, 90 s* ← **la más importante del bloque**

> «Esto lo contamos porque fue un error real. Primero construimos un panel. Todo lo
> que habíamos hecho estaba del lado del operador. El dinero no tenía dónde
> ocurrir: un panel perfecto donde nadie compra. El diagnóstico vino después, no
> antes. Y la corrección fue partir la experiencia en dos superficies.»

*Y añadir:* «Se resolvió con una especificación derivada en vez de reescribir el
contrato original, porque reescribir un contrato vivo rompe su trazabilidad.»

*Señalar el pie de la captura: los indicadores declaran que se calculan sobre los
primeros 100 registros. Esa honestidad es deliberada.*

### 5 · Un solo dato, dos lecturas — *Juan Nicolas, 60 s*

> «La columna stock es la misma en las dos pantallas. AGOTADO y BAJO·2 no son
> adornos: son la regla de negocio RN-11 diciendo la verdad.»

*Señalar el botón verde de reactivar: la baja es lógica, no borrado físico.*

### 6 · Cierre del bloque 1 — *Juan Nicolas, 15 s*

> «Eso es el producto. Lo que sigue no es cómo se ve, sino cómo se construyó y cómo
> se comprobó. Empieza Luisa.»

---

### 7 · La respuesta de la ingeniería — *Luisa, 60 s*

> «Tres capas, un contrato de requisitos versionado, y ninguna regla de negocio en
> el cliente. Cada tarjeta es una decisión, no una tecnología: para cada una está
> escrita la alternativa que se descartó y el motivo.»

### 8 · Cuatro decisiones no obvias — *Luisa, 90 s*

> «El SKU es inmutable, porque el comercio puede tenerlo impreso. Nada se borra de
> verdad: la baja marca `active=false` y es reversible. El token de acceso vive solo
> en memoria, porque el almacenamiento local es legible por cualquier script
> inyectado. Y los errores son datos: RFC 7807, el cliente reacciona al código.»

*Si preguntan por el SKU, decir el coste: corregir uno mal capturado exige una
operación de soporte específica.*

### 9 · El fallo de la sesión — *Luisa, 90 s*

> «Este bug solo aparece cuando el sistema se usa de verdad. El acceso expira,
> varias peticiones fallan a la vez, cada una dispara su propia renovación con el
> mismo token, y como el token es de un solo uso la segunda se lee como
> reutilización maliciosa. Se revocaba la familia completa: sesión legítima muerta.
> La corrección fue coalescer las renovaciones en una sola operación en vuelo.»

*Es la lámina que demuestra criterio: un fallo de concurrencia con síntoma de
seguridad.*

### 10 · El sistema medido — *Luisa, 60 s*

> «75 requisitos, 6 migraciones, 10 operaciones de API, 11 rutas, 12 decisiones
> arquitectónicas. Y advierto: la honestidad de estas cifras es justo lo que viene
> ahora.»

### 11 · Cierre del bloque 2 — *Luisa, 15 s*

> «El sistema está construido con reglas explícitas y cada regla tiene un motivo
> escrito. Ahora la parte que más cuesta decir: qué está verificado y qué no.»

---

### 12 · La respuesta incómoda — *Ana Sofía, 60 s*

> «38 pruebas end-to-end en verde y cero pruebas de backend. Lo digo primero porque
> es lo primero que va a preguntar el jurado, y porque el sistema funciona: se
> verificó endpoint por endpoint contra la aplicación levantada. Lo que no existe
> es la red que lo vuelva a demostrar solo.»

### 13 · Lo que sí es ejecutable — *Ana Sofía, 60 s*

> «38 pruebas en navegador real, escritorio y móvil. Cero violaciones graves de
> accesibilidad, con axe corriendo dentro de cada prueba. Once rutas con sus estados
> propios. Y además hay dos cosas comprobables a mano: la rotación de un solo uso
> devolviendo 401, y la autorización: usuario común 403, anónimo 401.»

*Matiz que impresiona: los tests no usan almacenamiento de sesión porque el token
vive en memoria, así que cada prueba se autentica por la interfaz.*

### 14 · Configurado no es ejecutado — *Ana Sofía, 90 s*

> «Aquí está el argumento. La cobertura mínima está configurada al 80 % y nunca se
> ejecutó. El puntaje de mutación, al 60 %, igual. Y no hay integración continua.
> Sin integración continua, las otras dos compuertas son configuración que nadie
> dispara. Un umbral que nunca corre no es un umbral: es un mensaje de intenciones.»

### 15 · El plan, en orden — *Ana Sofía, 60 s*

> «El orden no es por dificultad, es por dependencia. Primero integración continua,
> porque sin ella nada más se ejecuta solo. Después pruebas de backend con
> PostgreSQL real en contenedor. Después la matriz de trazabilidad. Y en paralelo,
> la medición de usabilidad, que es la única que depende de una persona y no de una
> herramienta.»

### 16 · Cierre — *Los tres, 30 s*

> «Un sistema construido con reglas explícitas, una documentación que se contradice
> a sí misma y por eso es creíble, y un plan que empieza por lo que hace posible todo
> lo demás. La documentación está abierta, la licencia es MIT. Gracias.»

---

## Preguntas previsibles

| Pregunta | Respuesta corta |
|---|---|
| ¿Por qué no hay pruebas unitarias de backend? | Por tiempo. Es la brecha central y el plan la pone segunda. Lo que sí hay es verificación manual documentada endpoint por endpoint. |
| ¿Por qué el SKU es inmutable? | El comercio puede tenerlo impreso o publicado; cambiarlo rompe una referencia externa. El coste es que corregirlo exige soporte. |
| ¿Qué pasa con la concurrencia de sesiones? | Se coalescen las renovaciones; el token es de un solo uso y la familia se revoca ante reutilización. |
| ¿Cómo manejan la seguridad? | BCrypt, JWT de 15 min en memoria, refresco de 7 días en cookie HttpOnly, rotación de un solo uso, lista negra en Redis, y el rol se comprueba en el servidor. Lo que falta: límite de tasa y escaneo dinámico. |
| ¿El proyecto es de una persona o de tres? | De tres. El reparto está por incrementos entregables y cada uno tiene su nota de entrega. |
| ¿La cotización se guarda? | No. La página y el carrito existen; el envío al servidor es la brecha 13. Es una decisión pendiente, no un olvido. |

---

## Si sobra tiempo

| Lámina | Qué añadir |
|---|---|
| 8 | La asimetría deliberada: el servidor acepta precio 0, el cliente exige mayor que cero. Está documentada en ambos lados a propósito. |
| 13 | Que la auditoría de accesibilidad corre dentro de la suite, no como revisión aparte: por eso una regresión no pasa inadvertida. |
| 15 | Que hay 15 brechas registradas en total y estas son las cinco con mejor relación entre esfuerzo y valor. |

## Si falta tiempo

| Recortar | Cómo |
|---|---|
| Lámina 3 | Nombrar las tres tarjetas sin desarrollarlas. |
| Lámina 5 | Un solo renglón sobre RN-11 y seguir. |
| Lámina 10 | Dejar las cifras en pantalla y no leer ninguna. |

**Nunca recortar:** la 4 (corrección de rumbo), la 12 (la cifra incómoda) y la 14
(configurado ≠ ejecutado). Son las que hacen creíble todo lo demás.

---

## Antes de presentar — lista de verificación

- [ ] `index.html` abierto y probado con `f` (pantalla completa).
- [ ] La aplicación corriendo en `http://localhost:3000` por si hay que abrirla en vivo.
- [ ] Credenciales del panel a mano: `admin@stockly.co` / `Admin1234`.
- [ ] Reparto de bloques confirmado: Juan Nicolas (1–6), Luisa (7–11), Ana Sofía (12–15).
- [ ] Cronómetro a la vista: 15 minutos es el tiempo, no 20.
- [ ] Alguien del equipo con el cronómetro que avise a los 4:30 de cada bloque.

---

## Regenerar el deck

Las láminas **no se editan en `index.html`**. Se editan los parciales y se reconstruye:

```bash
# 1. cambiar el texto de una lamina
$EDITOR docs/presentacion/slides/*.html

# 2. reconstruir el HTML autocontenido
python3 docs/presentacion/build.py

# 3. (opcional) refrescar capturas y PDF — requiere la app levantada
cd apps/web
node scripts/shots.mjs            # recaptura la aplicacion
python3 ../../docs/presentacion/build.py
node scripts/shoot-deck.mjs --pdf # revision visual + PDF
```

Las capturas de la aplicación se generan con `apps/web/scripts/shots.mjs`, que
inicia sesión por la interfaz real y toma 10 vistas.