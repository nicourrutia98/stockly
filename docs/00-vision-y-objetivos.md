# 00 — Visión y objetivos

> Propósito del sistema, público destinatario, alcance, restricciones y metas
> medibles.

---

## 1. Propósito

**Stockly** es una plataforma web de gestión de inventario de productos con dos
superficies diferenciadas:

- **Tienda pública** (`/catalogo`, `/catalogo/[id]`, `/cotizacion`) — un
  comprador consulta qué hay disponible, a qué precio y en qué cantidad, sin
  necesidad de crear una cuenta.
- **Panel de administración** (`/admin/*`) — el operador de negocio gestiona el
  catálogo: crear, editar, dar de baja y consultar productos.

El sistema no es un ejercicio de CRUD aislado. El objetivo académico es
demostrar el ciclo completo de ingeniería de software con una pila de producción
real: especificación versionada, decisiones arquitectónicas justificadas,
verificación con evidencia y control de desviaciones.

## 2. Contexto y problema

El cliente objetivo es un pequeño comercio que hoy controla su inventario en una
hoja de cálculo. Eso produce tres problemas concretos:

| Problema | Consecuencia observable |
|---|---|
| No hay una fuente única de verdad del stock | Se vende lo que ya no hay; el comprador llega y se le niega el producto. |
| Los precios y las existencias no se publican para el comprador | La venta se pierde antes de empezar, porque nadie puede ver qué hay. |
| No hay registro de qué cambió ni cuándo | Cuando algo falla no hay forma de saber qué pasó ni cuándo. |

Stockly ataca los tres: catálogo público de solo lectura alimentado por la misma
tabla que edita el administrador, y un registro de auditoría de quién cambió
qué y cuándo.

## 3. Público destinatario

| Usuario | Necesidad | Superficie |
|---|---|---|
| **Comprador** (visitante, sin cuenta) | Ver qué hay, cuánto cuesta y si está disponible antes de pedir cotización. | `/catalogo`, `/cotizacion` |
| **Operador** (usuario registrado, `ROLE_USER`) | Poder consultar su sesión y la información que el sistema le comparta. | `/login`, sesión |
| **Administrador** (`ROLE_ADMIN`) | Mantener el catálogo: alta, edición, baja y consulta. | `/admin/products*` |
| **Soporte / mantenimiento** (futuro) | Instalar, operar y diagnosticar sin leer todo el código. | Documentación, OpenAPI, Docker |

## 4. Metas medibles

Cada meta tiene un criterio de éxito verificable. La columna *Estado* resume el
avance real; el detalle está en [04 Estado y brechas](04-estado-y-brechas.md).

| ID | Meta | Criterio de éxito | Estado |
|---|---|---|---|
| **OG-01** | Gestión de catálogo completa y auditable | Los 5 verbos del catálogo (listar, ver, crear, editar, dar de baja) funcionan contra la aplicación en ejecución y cada escritura queda registrada con autor y marca de tiempo. | Cumplido |
| **OG-02** | Sesiones seguras | El token de refresco es de un solo uso; reutilizarlo devuelve `401` y la familia de tokens queda revocada. Verificado end-to-end. | Cumplido |
| **OG-03** | Uso bilingüe | Toda la interfaz y todos los mensajes del servidor existen en español (Colombia) e inglés; el formato de moneda cambia con el idioma activo. | Parcial |
| **OG-04** | Accesibilidad de nivel AA | Cero violaciones `serious` o `critical` en WCAG 2.0 A/AA sobre los flujos principales, verificado con axe-core en cada prueba end-to-end. | Cumplido |
| **OG-05** | Calidad objetiva demostrable | Cobertura de líneas del backend ≥ 80 % y puntaje de mutación ≥ 60 %, ambos como compuertas que fallan la compilación. | Configurado, no ejecutado |
| **OG-06** | Usabilidad medida, no supuesta | Tasa de éxito de tareas ≥ 90 %, SUS ≥ 68, SEQ ≥ 5 por flujo y NASA-TLX ≤ 60 en el flujo más pesado. | Protocolo listo, medición pendiente |
| **OG-07** | Trazabilidad completa | Cada requisito funcional y no funcional enlaza al menos una prueba; cada prueba enlaza un requisito. Bidireccional. | Pendiente |
| **OG-08** | Desviaciones resueltas por una persona | Todo artefacto publicado pasa por juicio de desviación y todo veredicto que requiere juicio humano queda registrado y resuelto por el operador. | Cumplido |

## 5. Alcance

### 5.1 Dentro del alcance

1. **Backend REST** con autenticación y autorización por rol, operaciones CRUD
   sobre productos con búsqueda, filtros, ordenamiento y paginación, y errores
   estandarizados.
2. **Frontend Next.js** con tienda pública, panel de administración, formularios
   validados en cliente y en servidor, y soporte bilingüe.
3. **Capa compartida** de contratos de datos (tipos y esquemas de validación)
   consumidos por ambos lados.
4. **Persistencia relacional** con control de concurrencia optimista y versionado
   del esquema.
5. **Calidad verificable**: pruebas unitarias, de integración, end-to-end y de
   contrato; accesibilidad automática; medición de usabilidad.
6. **Documentación**: contrato de API, documentación de código, esta
   documentación de ingeniería y bitácora de cambios.

### 5.2 Fuera del alcance (decisiones explícitas)

Estas cosas se pensaron y se descartaron a propósito. Dejarlas fuera es una
decisión de ingeniería, no una omisión.

| Descartado | Razón |
|---|---|
| Arquitectura hexagonal en el backend | El proyecto lo mantiene una persona. La separación en capas clásica es legible y suficiente; la hexagonal añadiría indirección sin beneficio a esta escala. |
| Aplicación de escritorio o móvil nativa | El alcancePedido es web. Responsive cubre el caso móvil. |
| Multi-inquilino / multi-tenant | Stockly sirve a un solo comercio. El modelo de datos no lo necesita. |
| Variantes de producto (talla, color) | No están en el modelo de negocio del cliente. Añadirlas exigiría reescribir el modelo de datos. |
| Carga de imágenes de producto | El catálogo trabaja con datos de texto; la carga de binarios exige almacenamiento de objetos y validación de contenido, un proyecto aparte. |
| Pasarela de pago | El flujo es cotización, no pago. El cierre de la venta ocurre fuera del sistema. |
| Recuperación de contraseña por correo | Requiere un servidor de correo saliente y gestión de tokens de un solo uso. Se documentó como historia futura. |

## 6. Restricciones

| # | Restricción | Origen |
|---|---|---|
| **R-01** | Java 17, Node 20+, pnpm 9+, Maven 3.9+, Docker. | Entorno objetivo fijada en la especificación. |
| **R-02** | PostgreSQL 16 y Redis 7 para desarrollo, provistos por Docker Compose. | Dependencias de infraestructura. |
| **R-03** | Equipo de tres personas, con el trabajo repartido por incrementos entregables. Impacta todo: se prefirió lo legible sobre lo más flexible. | Condición del proyecto. |
| **R-04** | Idioma de la interfaz: español de Colombia e inglés, sin más variantes. | Necesidad del cliente y de la evaluación. |
| **R-05** | Licencia MIT. | Decisión del autor, sin restricciones adicionales. |
| **R-06** | Presupuesto de tiempo de una asignatura. El plan se prioriza por riesgo, no por comodidad. | Condición académica. |

## 7. Principios de diseño

Cuatro decisiones que atraviesan todo el sistema y que explican la mayor parte de
las particularidades del código:

1. **El servidor es la autoridad.** Toda regla que protege datos o dinero se
   valida en el backend. La validación del cliente existe para dar respuesta
   inmediata, nunca para proteger. Consecuencia visible: los esquemas de Zod en
   `packages/shared` son más estrictos que los del servidor en el precio
   (positivo contra no negativo), y esa asimetría está documentada a propósito.
2. **Nada se borra de verdad.** Un producto dado de baja queda con
   `active = false`. Esto preserva la integridad referencial y hace reversible
   una eliminación accidental.
3. **Los errores son datos.** Cada fallo de la API responde en un formato
   estándar (RFC 7807) con un identificador de tipo estable y un mensaje
   localizado. El cliente puede reaccionar al código, no al texto.
4. **Lo que no se demuestra no existe.** Un requisito sin prueba que lo exercise
   no se considera entregado. De ahí el protocolo de desviaciones: cada
   artefacto se publica, se juzga contra la especificación y las diferencias se
   registran antes de seguir.

## 8. Definición de terminado (Definition of Done)

Una historia está terminada cuando cumple **las cinco** condiciones:

1. El código está escrito y compila sin errores de tipado.
2. Existe al menos una prueba que exercise el comportamiento por la vía que el
   usuario lo consume.
3. Los mensajes de error y validación existen en ambos idiomas.
4. La diferencia contra la especificación fue juzgada y resuelta, o está
   registrada como brecha aceptada.
5. El requisito tiene identificador (`RF-`/`RNF-`) y está enlazado a su prueba.