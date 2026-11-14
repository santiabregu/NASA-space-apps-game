# NASA-space-apps-game

Juego de diseño de misiones espaciales para NASA Space Apps. Diseño y planificación en [docs/](docs/).

- `frontend/`: Vite + React + Tailwind
- `backend/`: Spring Boot 4 (Java 21) + H2 + JWT

## Desarrollo local

Requisitos: **JDK 21** y **Node 22**.

```bash
# Terminal 1: backend en http://localhost:8080
cd backend
./mvnw spring-boot:run "-Dspring-boot.run.profiles=dev"

# Terminal 2: frontend en http://localhost:5173 (redirige /api al backend)
cd frontend
npm install
npm run dev
```

En PowerShell las comillas del `-D...` son obligatorias. Si Maven usa otra versión de Java, antes de arrancar:
`$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"`.

Con el perfil `dev`, la consola de H2 está en http://localhost:8080/h2-console
(JDBC URL `jdbc:h2:file:./data/juego`, usuario `sa`, sin contraseña).

## Despliegue en Render

Un solo servicio Docker: el [Dockerfile](Dockerfile) compila el frontend y Spring Boot lo sirve junto con la API.

1. En Render: **New → Blueprint** y elegir este repositorio. Render lee [render.yaml](render.yaml) y genera `JWT_SECRET` automáticamente.
2. Cada push a `main` vuelve a desplegar.

> **Datos en el plan gratuito:** el disco de Render es temporal. La base de datos H2 **se borra** al redesplegar
> y cuando el servicio se duerme (tras 15 minutos sin visitas). Para conservar las cuentas hace falta el plan
> Starter + un disco persistente montado, por ejemplo, en `/var/data`, y la variable `DB_URL=jdbc:h2:file:/var/data/juego`.
