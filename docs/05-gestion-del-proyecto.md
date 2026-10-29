# 05 — Gestión del proyecto

> Cómo se planeó, repartió y controló el trabajo; cómo se gobiernan los
> cambios; y qué métricas describen el estado del proyecto.

---

## 1. Modelo de trabajo

El proyecto se gobierna con un **contrato de especificación versionada** y un
**ciclo de entrega gobernado**. Las dos piezas están implementadas por
`dark-memory`, un servidor de contexto del proyecto que actúa como fuente de
verdad externa al repositorio.

| Pieza | Qué es |
|---|---|
| **Especificación (`spec`)** | Un artefacto estructurado con el objetivo del trabajo, sus restricciones, sus datos y sus tareas. No es un documento de texto: es un objeto que se puede consultar, versionar y juzgar. |
| **Constitución** | El conjunto de reglas que toda entrega debe respetar (aprobación humana por paso, registro de auditoría, recalls antes de escribir). |
| **Publicación (`publish`)** | Presentar una entrega contra un contrato. El sistema la juzga y devuelve un veredicto. |
| **Juzgo de desviación** | Compara la entrega con el contrato y devuelve uno de tres veredictos: **alineado**, **desviación detectada**, **requiere juicio humano**. |
| **Resolución de desviación** | La decisión final sobre una desviación. Solo una persona la toma. |

### 1.1 Identificadores de este proyecto

| ID | Contenido |
|---|---|
| `spec_id=6` | Especificación principal: 15 tareas, nivel de integridad 3 |
| `spec_id=11` | Plan paraguas de frontend, seis incrementos |
| `spec_id=13` | Pruebas de extremo a extremo con medición psicométrica |
| `spec_id=18` | Accesibilidad e intuición de uso |
| `spec_id=20` | Actualización del producto mínimo viable: tienda pública y honestidad del estado |

## 2. Los tres veredictos y qué hacer con cada uno

| Veredicto | Significado | Acción |
|---|---|---|
| **Alineado** | La entrega cumple lo que el contrato pedía. | Se continúa con la siguiente tarea. |
| **Desviación detectada** | Hay una diferencia concreta y localizable. | Se corrige y se vuelve a publicar. No se avanza con la desviación abierta. |
| **Requiere juicio humano** | Algo no se puede decidir automáticamente: el veredicto no tiene base suficiente, o la comprobación automática está bloqueada. | **Alto.** Se detiene, se documenta el caso y una persona decide con criterio. |

> El tercer veredicto es el que distingue este proceso de un trámite. Cuando el
> juez automático dice "no sé", el sistema **no adivina**: escala a la persona. En
> este proyecto ocurrió en varias publicaciones y la decisión siempre fue
> explícita y quedó registrada.

## 3. Plan de trabajo

### 3.1 Plan original — 15 tareas

| Bloque | Tareas | Contenido |
|---|---|---|
| **Cimientos** | `T1` | Monorepo, configuración, infraestructura local, documentación inicial |
| **Dominio** | `T2`–`T4` | Entidad y validación, persistencia y esquema, servicio y errores |
| **Interfaz de servicio** | `T5`, `T7` | Endpoints REST y documentación de la API; localización |
| **Seguridad** | `T6` | Autenticación, rotación de refresco, revocación |
| **Cliente** | `T8`–`T10` | Arranque del frontend, pantallas y estado, idiomas y moneda |
| **Calidad** | `T11`–`T13` | Pruebas de backend, pruebas de frontend, seguridad y carga |
| **Cierre** | `T14`, `T15` | Documentación; cierre de brechas con trazabilidad |

### 3.2 Especificaciones derivadas

El plan original resultó **dividido por el medio** en una fecha: la mitad
posterior (catálogo público, accesibilidad, usabilidad) no estaba prevista y sí
era necesaria para que el producto tuviera comprador. Se resolvió con
especificaciones derivadas en lugar de reescribir el contrato principal, porque
modificar un contrato vivo rompe su trazabilidad.

| Especificación | Qué añadió | Por qué nació |
|---|---|---|
| `spec_id=13` | Inventario de 7 flujos, arnés de pruebas, medición psicométrica con umbrales | Se verificó el sistema manualmente, pero sin forma de demostrar la usabilidad. |
| `spec_id=18` | Corrección de contraste, diálogo de borrado accesible, estados vacío y de carga, buscador, español consistente | Una auditoría automática encontró dos violaciones graves y una revisión con heurísticas encontró cinco fricciones. |
| `spec_id=20` | Tienda pública con búsqueda y filtros, señales honestas de disponibilidad, medición del comprador | Diagnóstico: el sistema era íntegramente un panel tras iniciar sesión. No había dónde ocurra la venta. |

### 3.3 Incrementos de frontend (`spec_id=11`)

| ID | Contenido | Estado |
|---|---|---|
| `FE-T1` | Tema, capas de idioma, marco de navegación, fuentes propias | Completado |
| `FE-T2` | Registro, sesión global, guardas de rol, corrección de autorización en servidor | Completado |
| `FE-T3` | Búsqueda, filtros, insignias de existencias, estado vacío | Completado |
| `FE-T4` | Detalle administrativo, ruta de navegación, baja reversible | Completado |
| `FE-T5` | Panel de indicadores del admin y estados del sistema (carga, error, no encontrado) | Completado |
| `FE-T6` | Pruebas unitarias del frontend, verificación de tipado, análisis, compilación final | Parcial |

### 3.4 Corrección de rumbo: de panel a tienda

El cambio más importante del proyecto no fue técnico. El diagnóstico fue este:

> El sistema consistedía en un panel de administración al que se entra después de
> iniciar sesión. Es decir, todo lo construido estaba del lado del operador y
> nada del lado del comprador. **El dinero no tenía dónde ocurrir.**

La corrección fue partir la experiencia en dos superficies:

| Antes | Después |
|---|---|
| Catálogo = panel tras autenticación | Catálogo = público, sin cuenta |
| El comprador no tenía punto de entrada | `/catalogo` con búsqueda y filtros |
| Estado de existencias invisible | Señales de disponibilidad honestas en el producto |
| Interfaz de administración como vista principal | Administración como herramienta de operación |

De esa decisión salió la regla de negocio `RN-12`: la honestidad del estado
—sin cuentas regresivas, sin escasez inventada, sin urgencia fabricada— es un
requisito del producto, no una cortesía visual. La escasez solo se comunica con
datos reales: existencias por debajo de un umbral muestran "Solo quedan N", cero
muestra "Agotado", y en ningún caso se simula presión temporal.

### 3.5 Priorización por riesgo

El esfuerzo se ordenó con la técnica de priorización basada en riesgo
(ISO/IEC/IEEE 29119-2), no por conveniencia:

| Nivel | Alcance | Cobertura exigida |
|---|---|---|
| **Crítico** | Acceso, permisos, veracidad de existencias | 100 % |
| **Medio** | Filtros, búsqueda, idiomas, formato de moneda | 80 % |
| **Bajo** | Afectos visuales, animaciones | 60 % |

El criterio es simple: si un defecto en un requisito crítico produce daño
irreversible o pérdida de confianza, se trata primero aunque sea el más tedioso.

## 4. Gobierno de los cambios

### 4.1 Regla de oro

**Ninguna entrega avanza sin que alguien haya mirado la diferencia entre lo
pedido y lo entregado.**

En la práctica eso significa:

1. La entrega se publica contra el contrato.
2. El sistema la juzga y devuelve un veredicto.
3. Si hay desviación, se corrige. Si requiere juicio humano, se detiene.
4. La resolución queda registrada con quién la decidió y por qué.

### 4.2 Registro de auditoría

Cada escritura al almacén del proyecto queda registrada con autor, sesión y
momento. Eso permite responder, meses después, a preguntas como: ¿por qué el SKU
es inmutable? ¿cuándo se decidió la baja lógica? ¿qué se verificó en la entrega
del 15 de octubre?

Este registro es la memoria de largo plazo del proyecto. Es lo que permite
continuar el trabajo sin depender de que alguien recuerde.

### 4.3 Registro de decisiones

Las decisiones con motivo se guardan como decisiones, no como notas. Ejemplos
reales de este proyecto:

| Decisión | Motivo registrado |
|---|---|
| Arquitectura en capas, no hexagonal | Equipo pequeño y dominio acotado; la hexagonal añade indirección sin beneficio a esta escala. |
| SKU inmutable | El comercio puede tenerlo impreso o publicado; cambiarlo rompe la referencia externa. |
| Token de acceso solo en memoria | El almacenamiento local es legible por scripts inyectados. |
| Borrado lógico | Preserva integridad referencial y hace reversible una eliminación accidental. |
| Esquema del paquete compartido en TypeScript | Java y TypeScript no comparten un validador razonable. |
| Publicación bajo licencia MIT sin restricciones adicionales | Una licencia con restricciones no es MIT; se descartó explícitamente una versión con prohibiciones. |

### 4.4 Correcciones registradas

Un caso que ilustra el valor del proceso: se propuso añadir restricciones de
licencia (prohibición de venta y distribución) y se implementó. El autor corrigió:
eso no es MIT. La acción fue eliminar la restricción del archivo de licencia,
retirar las menciones de la interfaz y de la documentación, y dejar únicamente
la atribución académica y la licencia MIT. La corrección quedó registrada como
decisión con su motivo.

## 5. Riesgos de proceso

| Riesgo | Manifestación | Control |
|---|---|---|
| Juicio automático no disponible | El juez automático requiere un proveedor de autenticación externo; sin él, la publicación queda bloqueada. | Degradar a compuerta humana: la persona verifica y resuelve. Registrado como limitación del entorno. |
| Verificación bloqueada por infraestructura | La descarga de dependencias falló por certificados con fecha no válida frente al reloj del sistema. | Se verificó por inspección estructural y se documentó como bloqueo de entorno, no de código. |
| Deriva silenciosa | El frontend valida contra un paquete compartido desactualizado si no se recompila. | Conocido, documentado y pendiente de automatizar en la tubería. |
| Especificación que envejece | El contrato principal no incluye el catálogo público. | Se resolvió con especificaciones derivadas en vez de modificar el contrato vivo. |
| Sobre-documentación | Más documento que producto. Riesgo real en trabajos académicos. | Regla: un documento existe porque responde una pregunta que alguien se hará. Si no, no se escribe. |

## 6. Métricas del proyecto

### 6.1 Producto

| Métrica | Valor | Fuente |
|---|---|---|
| Rutas de la aplicación | 10 | Enumeración del árbol de rutas |
| Operaciones de la API | 10 | 5 de catálogo + 5 de sesión |
| Componentes de interfaz | 8 | `apps/web/src/components` |
| Pruebas de extremo a extremo | 38 en verde | Suite Playwright |
| Migraciones de base de datos | 6 | Cambios Liquibase aplicados |
| Mensajes localizados | 24 claves, misma paridad en ambos idiomas | Archivos de mensajes |
| Marcas de tiempo de auditoría | 2 por registro | Auditoría automática de entidad |

### 6.2 Especificación

| Métrica | Valor |
|---|---|
| Tareas de la especificación principal | 15 |
| Tareas completas | 10 |
| Tareas parciales | 2 |
| Tareas sin iniciar | 3 |
| Requisitos catalogados | 72 (23 funcionales, 34 no funcionales, 15 de negocio) |
| Requisitos cumplidos | 58 |
| Brechas abiertas registradas | 14 |
| Riesgos abiertos | 9, más 5 aceptados |

### 6.3 Cómo leer estas métricas

Las cifras de producto y de especificación no son un tablero de progreso. Son un
punto de comparación: si alguien retoma el proyecto en seis meses, puede medir
qué cambió en lugar de reconstruir la historia desde cero. La métrica que más
importa no está aquí, y es `B-02`: **58 requisitos cumplidos, 0 de ellos cubiertos
por pruebas de backend**.

## 7. Reglas para quien continúe

1. **Una sesión por unidad de trabajo.** Se abre al empezar, se cierra al
   terminar. Una sesión por tarea, no una por día.
2. **Consulta antes de escribir.** Antes de crear un artefacto, revisar lo que ya
   se sabe. El registro de memoria es más barato y más fiable que reconstruir.
3. **Ninguna escritura sin sesión abierta.** El sistema lo rechaza; no es una
   recomendación.
4. **Publicar antes de continuar.** El juicio de desviación no es burocracia: es
   el momento en que se descubre que se resolvió un problema que no era el
   pedido.
5. **Una desviación no se cierra sola.** Si el veredicto requiere juicio humano,
   se documenta la decisión y quién la tomó.
6. **Recompilar el paquete compartido antes de compilar web.** Sin esto, el
   frontend valida contra el esquema anterior y falla de forma silenciosa.
7. **Cerrar limpio.** Si algo falló a medias, se registra como tal. Una sesión
   cerrada con el estado real es más útil que una sesión cerrada como si nada.