# 03 — Calidad y verificación

> Cómo se comprueba que Stockly funciona y que lo hace bien. Estrategia de
> pruebas, niveles de verificación, y las cinco dimensiones de calidad medidas.

---

## 1. Idea central

La diferencia entre un proyecto que *funciona* y uno que *está verificado* es que el
segundo puede responder a la pregunta "¿cómo sabes que funciona?" con una
evidencia que alguien más pueda repetir. Este proyecto aplica esa exigencia en
tres niveles:

1. **Verificación** — ¿el producto hace lo que dice el contrato? Se comprueba
   comparando cada entrega contra la especificación, y la diferencia se registra.
2. **Validación** — ¿el contrato dice lo que el usuario necesita? Se comprueba
   observando el uso real, no la intención declarada.
3. **Trazabilidad** — ¿puedo ir del requisito a la prueba y volver? Sin la matriz
   de trazabilidad, los dos anteriores son afirmaciones.

## 2. Marco de referencia

| Norma | Qué aporta |
|---|---|
| **IEEE 1012** (verificación y validación) | Niveles de integridad. Stockly se fija el **nivel 3**: el producto tiene consecuencias moderadas y el proceso debe poder demostrarlo. |
| **ISO/IEC/IEEE 29119-2** | Administración de requisitos: trazabilidad, validación y priorización por riesgo. |
| **ISO/IEC/IEEE 29119-3** | Proceso de prueba: niveles, ambiente, datos y control. |
| **WCAG 2.0/2.2 AA** | Criterios de accesibilidad para el contenido web. |
| **RFC 7807** | Formato estándar de respuesta de error. |
| **RFC 7396** | Semántica de fusión para actualización parcial. |

## 3. Niveles de prueba

Pirámide adaptada a este proyecto: muchas pruebas de interfaz y de flujo, pocas
de bajo nivel.

| Nivel | Qué prueba | Herramienta | Cantidad actual | Objetivo |
|---|---|---|---|---|
| **Unidad — backend** | Lógica de servicio con el repositorio simulado | JUnit 5 + Mockito | **0** ⚠ | Reglas de negocio aisladas, incluidas las de validación cruzada. |
| **Integración — backend** | Repositorio, servicio y transacciones contra base de datos real en contenedor | Spring Boot Test + Testcontainers (PostgreSQL 16) | **0** ⚠ | Que el SQL, las restricciones y las migraciones funcionan de verdad. |
| **Web — backend** | Controladores con usuario simulado, sin levantar la base de datos | Spring MVC Test + usuario simulado | **0** ⚠ | Contrato HTTP: estados, cabeceras y cuerpos de respuesta. |
| **Unidad — frontend** | Componentes y lógica aislados | Vitest + React Testing Library | 1 archivo de instrumentos | Un archivo existe; falta la suite completa. |
| **Integración — frontend** | Componentes contra una API simulada en red | MSW | **0** ⚠ | Estados de carga, error y vacío. |
| **Extremo a extremo** | Flujos completos en navegador real | Playwright (escritorio + móvil) | **38 pruebas en verde** | El requisito se cumple *por la vía que el usuario lo consume*. |
| **Accesibilidad** | Auditoría automática dentro de las pruebas E2E | axe-core | Incluida en 4 rutas | Cero violaciones graves. |
| **Contrato** | La API cumple su especificación publicada | OpenAPI + verificación de contrato | **0** ⚠ | Lo documentado y lo implementado no divergen. |
| **Seguridad** | Análisis estático de dependencias, escaneo dinámico, pruebas de manipulación de token | OWASP Dependency-Check, OWASP ZAP, pruebas dirigidas | **0** ⚠ | Ausencia de vulnerabilidades conocidas y resistencia a manipulación de token. |
| **Carga** | Comportamiento bajo concurrencia | k6 | **0** ⚠ | Latencia percentil 95 y tasa de error dentro de umbral. |
| **Usabilidad** | Percepción del usuario sobre el sistema | SUS / SEQ / NASA-TLX + métricas objetivas | Protocolo definido, sin medición | Que el sistema sea usable, no solo correcto. |

⚠ = brecha abierta. Ver [04 Estado y brechas](04-estado-y-brechas.md).

> **El punto honesto de esta sección:** la columna "Extremo a extremo" tiene 38
> pruebas en verde y las demás están vacías. El sistema *funciona* —fue
> verificado manualmente, endpoint por endpoint, contra la aplicación
> levantada—, pero la mayor parte de esa verificación no está capturada en
> código ejecutable que otro pueda volver a correr. Cerrar esa distancia es el
> trabajo pendiente de mayor valor del proyecto.

## 4. Matriz de verificación por requisito crítico

Los requisitos de mayor riesgo son los que tocan dinero o acceso. Estos tienen
verificación más densa:

| Requisito | Riesgo controlado | Verificación actual | Verificación de destino |
|---|---|---|---|
| `RF-02` Autenticación | Robo de credenciales | Manual + E2E de formulario | E2E automatizado + prueba de fuerza bruta + prueba de enumeración de usuarios |
| `RF-03` Renovación | Robo de sesión persistente | Manual: refresco, reutilización deliberada → `401` | E2E automatizado de la secuencia completa |
| `RNF-05` Autorización | Privilegio indebido | Manual: usuario común → `403`, anónimo → `401` | Prueba de contrato por endpoint y rol |
| `RN-10` Baja lógica | Pérdida de datos | Manual: baja, verificación de que sigue existiendo | Prueba de integración que compruebe la fila y su marca de tiempo |
| `RN-01` Unicidad de SKU | Duplicados que rompen la operación | Manual: alta duplicada → `409` | Prueba de integración con dos inserciones concurrentes |
| `RN-09` Edición parcial | Pérdida de datos por un campo no enviado | Manual: edición parcial conserva el resto | Prueba de unidad sobre el mapeo, con tabla de campos |
| `RNF-21` Accesibilidad | Usuario excluido del producto | axe-core en E2E: 0 graves | Mantener como compuerta en la integración continua |
| `RF-13`/`RF-14`/`RF-15` Escritura por rol | Modificación sin autorización | Manual con tres identidades | Matriz de contrato endpoint × rol |

## 5. Accesibilidad

| Aspecto | Enfoque | Resultado |
|---|---|---|
| Contraste de color | Se eliminó el gris atenuado por defecto en textos secundarios y se sustituyó por un gris que cumple AA. | Cero violaciones `serious` en la auditoría automática. |
| Color de insignias de estado | Verde y gris elegidos por su relación de contraste, no por costumbre visual. | Ambos por encima de 4,5:1. |
| Foco visible | Anillo de foco conservado en todos los componentes interactivos. | Verificado en navegación por teclado. |
| Navegación por teclado | Todos los flujos se completan sin ratón; el modal de confirmación devuelve el foco a un lugar predecible. | Verificado. |
| Estructura del documento | Un único título principal por vista; puntos de referencia semánticos; enlace de salto al contenido. | Verificado. |
| Formularios | Etiquetas asociadas a cada campo; mensajes de validación asociados por descripción. | Verificado. |
| Automatización | axe-core se ejecuta dentro de las pruebas E2E sobre las cuatro rutas principales. | Compuerta de integración continua. |

**Por qué se mide con herramienta y no a ojo.** Un revisor humano detecta entre
30 % y 40 % de los problemas de accesibilidad. La auditoría automática complementada
con revisión manual es la combinación que la norma recomienda, y aquí la
componente automática es la que impide una regresión silenciosa.

## 6. Seguridad

### 6.1 Verificado

| Control | Evidencia |
|---|---|
| Contraseñas con hash adaptativo (BCrypt, factor 10) | Configuración del codificador. |
| Token de acceso solo en memoria; token de refresco en cookie inaccesible a scripts | Inspección del cliente HTTP y del almacén de sesión. |
| Rotación de un solo uso con revocación distribuida | Prueba manual: reutilizar un token revocado devuelve `401`. |
| Autorización por rol en el servidor, no en la interfaz | Anotaciones sobre los tres métodos de escritura. |
| Origen permitido configurable | Configuración de CORS, valores de desarrollo reemplazables. |
| Sin secretos versionados | Solo hay archivos de ejemplo. |

### 6.2 Configurado, aún sin ejecutar

| Control | Estado |
|---|---|
| Análisis de dependencias con falla ante vulnerabilidad de severidad ≥ 7 | Complemento configurado en el gestor de dependencias; requiere ejecutar para producir el informe. |
| Escaneo dinámico de la aplicación levantada | Guion pendiente. |
| Limitación de tasa en el inicio de sesión | Pendiente. |

### 6.3 Pruebas de seguridad que faltan

1. Manipulación de token: firma alterada, identificador desconocido, token
   expirado, algoritmo distinto. Todos deben producir `401` y ningún mensaje debe
   revelar el motivo.
2. Enumeración de usuarios: el login debe fallar igual con usuario inexistente y
   con contraseña incorrecta, tanto en estado como en tiempo de respuesta.
3. Ascada de privilegios: un usuario registrado no puede crear, editar ni dar de
   baja productos por ninguna vía, incluidas las llamadas directas a la API.
4. Inyección en los filtros de búsqueda: los parámetros de texto no deben poder
   alterar la consulta.
5. Objetivo de sesión ajena: con el identificador de otro producto, un usuario
   sin permiso recibe `403`, no los datos.

## 7. Rendimiento

| Requisito | Umbral | Cómo se mide | Estado |
|---|---|---|---|
| Latencia de lectura del catálogo | percentil 95 < 200 ms | Prueba de carga con 50 usuarios virtuales durante 5 minutos | Pendiente |
| Tasa de error bajo carga | < 1 % | La misma prueba | Pendiente |
| Tamaño de página acotado | Máximo declarado en el controlador | Inspección | Cumplido |

> La prueba de carga se define sobre lectura de catálogo porque es el único
> endpoint que un comprador puede invocar sin autenticación y, por tanto, el que
> puede recibir tráfico no previsto. Es la primera línea que se rompe.

## 8. Usabilidad: medición, no suposición

### 8.1 El error que se quiere evitar

Medir "usabilidad" preguntando al desarrollador si la aplicación le gusta no
produce información. El problema es que la interfaz fue diseñada por la misma
persona que la usa, y todo le resulta evidente. La evidencia útil tiene que venir
de alguien que no conoce el sistema y de datos que no dependen de la memoria del
participante.

### 8.2 El enfoque de tres capas

| Capa | Qué mide | Instrumento |
|---|---|---|
| **Objetiva** | ¿La persona logró la tarea y cuánto tardó? | Tasa de éxito y tiempo por tarea, registrados automáticamente por la suite. |
| **Subjetiva por tarea** | ¿Esa tarea en particular fue fácil? | SEQ, una sola pregunta de 7 puntos después de cada tarea. |
| **Subjetiva global** | ¿Qué tan usable es el sistema en conjunto? | SUS, 10 ítems, escala 1–5. |
| **Esfuerzo percibido** | ¿Cuánto le costó trabajar aquí? | NASA-TLX sobre el flujo más pesado. |

Las tres capas se leen juntas: una tasa de éxito del 100 % con SEQ bajo indica
que la persona lo logró por ensayo y error, y eso es un problema real. La métrica
objetiva sin la subjetiva no ve la frustración; la subjetiva sin la objetiva no
distingue lo difícil de lo imposible.

### 8.3 Umbrales

| Métrica | Umbral | Referencia | Interpretación |
|---|---|---|---|
| Tasa de éxito global | ≥ 90 % | — | Por debajo, hay al menos un flujo que casi siempre falla. |
| SEQ por tarea | ≥ 5 / 7 | Escala de Likert de 7 puntos | Por debajo de 5 se anota qué trabó, con cita textual si es posible. |
| SUS | ≥ 68 | Suslau (1996) | "Aceptable" desde 68; "Bueno" desde 80; "Excelente" desde 85. |
| NASA-TLX en el flujo más pesado | ≤ 60 | Escala de trabajo bruto | Por encima, la carga percibida es alta aunque todo funcione. |

### 8.4 Flujos medidos

El inventario de flujos vive en [F1 — Inventario de flujos de usuario](F1-flujos-usuario.md).
Cada flujo tiene: dirección, precondición de autenticación, marcadores de
interfaz, caso de éxito y caso de error. El protocolo de sesión con el
participante está en [F4 — Protocolo de sesión psicométrica](F4-protocolo-sesion.md).

| Flujo | Descripción | SEQ |
|---|---|---|
| `FL-03` | Iniciar sesión | Sí |
| `FL-04` | Consultar y navegar el panel | Sí |
| `FL-05` | Crear un producto | Sí |
| `FL-06` | Editar un producto | Sí |
| `FL-07` | Comportamiento de la sesión en toda la aplicación | No aplica |

## 9. Criterios de aceptación ejecutables

El estándar ISO/IEC/IEEE 29119 y el propio contrato de ingeniería piden que los
criterios de aceptación sean **ejecutables**, no descripciones en prosa. El
formato previsto es:

```gherkin
Escenario: un administrador crea un producto
  Dado    que un usuario con permiso de administrador está autenticado
  Cuando  crea un producto con SKU "CAF-001", nombre "Café molido",
          precio 12500, existencias 10 y categoría "Bebidas"
  Entonces la API responde 201 y el producto aparece en el listado
  Y       el catálogo público lo muestra con disponibilidad "Disponible"
```

Cada escenario lleva una etiqueta con el identificador del requisito que
verifica (`@REQ-RF-13`), lo que permite a la matriz de trazabilidad cruzarlos en
ambos sentidos.

**Estado actual:** el formato y el enlace por etiqueta están definidos; los
archivos de escenarios aún no se escriben. Es la brecha `RNF-14`.

## 10. Trazabilidad

La matriz de trazabilidad es el artefacto que convierte el resto de esta sección
en evidencia. Debe ser una tabla con una fila por requisito:

| Requisito | Tipo | Riesgo | Prueba(s) | Nivel | Evidencia de ejecución | Estado |
|---|---|---|---|---|---|---|
| `RF-13` | Funcional | Alto | — | — | Verificación manual | ⚠ sin prueba |

Y un guion que la recorra buscando tres defectos a la vez:

1. **Requisito sin prueba** — una fila sin prueba significa un requisito cuya
   conformidad nadie puede demostrar.
2. **Prueba sin requisito** — una prueba sin requisito significa cobertura que
   puede desaparecer sin que nadie lo note al cambiar el alcance.
3. **Requisito con estado incorrecto** — una fila marcada como cumplida cuya
   prueba falla.

Los dos primeros son baratos de detectar y casi siempre revelan algo real. El
tercero es el que protege contra la deriva silenciosa entre la documentación y el
código.

## 11. Compuertas de calidad

La intención es que estas compuertas fallen la compilación, no que produzcan un
informe que nadie lee.

| Compuerta | Umbral | Configuración | Ejecutada |
|---|---|---|---|
| Cobertura de líneas (backend) | ≥ 80 % | Sí, en la fase de verificación | No (no hay pruebas backend) |
| Cobertura de líneas (frontend) | ≥ 70 % | No | No |
| Puntaje de mutación (dominio) | ≥ 60 % | Sí | No |
| Accesibilidad | 0 violaciones graves | Sí, dentro de las pruebas E2E | **Sí** |
| Vulnerabilidad de dependencia | Falla ante CVSS ≥ 7 | Sí | No |
| Rendimiento | percentil 95 < 200 ms | Guion pendiente | No |
| Usabilidad | Éxito ≥ 90 %, SUS ≥ 68 | Puntuación automática preparada | No |
| Integración continua | Ejecuta todo lo anterior en cada entrega | No existe | No |

> La fila de integración continua es la más importante del cuadro: sin ella,
> las demás compuertas son configuran que nadie dispara. Construirla es un trabajo
> corto —un archivo de configuración de integración continua y dos órdenes— y
> su ausencia es la brecha que más rápido se cierra.