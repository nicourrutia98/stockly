# =============================================================================
# Stockly backend — imagen de producción (Spring Boot 3.4.1 / Java 17).
#
# Se usa en Railway / Render / Fly.io / Cloud Run. Vercel NO puede ejecutar
# este servicio (no hay runtime Java ni proceso de larga duración).
#
#   docker build -t stockly-backend ./apps/backend
#   docker run -p 8080:8080 -e DATABASE_URL=jdbc:postgresql://... stockly-backend
# =============================================================================

# ---------- Etapa 1: build ----------
FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /build

# Capa de caché: primero solo el pom, luego las dependencias.
COPY pom.xml ./
RUN mvn -B -q dependency:go-offline

COPY src ./src
RUN mvn -B -q clean package -DskipTests

# ---------- Etapa 2: runtime ----------
FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

# Usuario sin privilegios (la imagen base no lo trae).
RUN groupadd --system stockly \
    && useradd --system --gid stockly --home /app stockly \
    && chown -R stockly:stockly /app

COPY --from=build --chown=stockly:stockly /build/target/*.jar /app/app.jar

USER stockly

# Railway/Render inyectan PORT; el default 8080 coincide con EXPOSE.
ENV PORT=8080 \
    JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+UseContainerSupport -Djava.security.egd=file:/dev/./urandom"

EXPOSE 8080

# Healthcheck contra el endpoint público de actuator.
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=5 \
  CMD curl -fsS "http://localhost:${PORT}/actuator/health" || exit 1

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
