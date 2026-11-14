# Planificación principal

> Versión 0.2 · borrador para revisión. Pensada para una hackathon de **48 h** y un equipo de **hasta 4 personas**.

---

## 1. Qué tenemos que poder enseñar en la demo

1. **Registro e inicio de sesión** con correo y contraseña.
2. **Tutorial completo:** crear la empresa → comprar piezas → montar el satélite → montar el cohete → lanzar → satélite en órbita.
3. **Una misión individual** del Gobierno, elegida según los recursos, con informe final que explica por qué salió bien o mal.
4. **Progreso:** dinero, conocimiento (XP), nivel y reputación cambian según el resultado.
5. **Una misión de grupo en tiempo real** con 2 jugadores (2 navegadores, 2 cuentas).

Si a la hora 40 solo funcionan los puntos 1–4, **la demo sigue siendo buena**. El multijugador es lo más arriesgado y va al final.

---

## 2. Stack

| Capa | Herramienta |
|---|---|
| Frontend | Vite + React (JSX) + Tailwind CSS |
| Animaciones | CSS (transiciones y keyframes de Tailwind) desde JSX |
| Estado en el frontend | `useReducer` + Context |
| Backend | **Spring Boot 3** (Java 21) |
| Base de datos | **H2** en modo fichero + Spring Data JPA |
| Autenticación | Spring Security · contraseñas con **BCrypt** · sesión con **JWT** |
| Tiempo real (multijugador) | **WebSocket con STOMP** (incluido en Spring) |
| Despliegue | **Render**, un solo servicio Docker: Spring Boot sirve el frontend compilado y la API |

**Notas:**
- **H2 es una base de datos de Java**, por eso el backend es Spring Boot. Desde la consola web de H2 (`/h2-console`) se ven las tablas mientras se desarrolla.
- En el plan gratuito de Render el disco se borra al volver a desplegar **y cuando el servicio se duerme** (15 minutos sin visitas). Antes de presentar: abrir la web unos minutos antes y crear allí las cuentas de la demo.
- Las fórmulas (Δv, potencia, masa) se calculan **en el frontend**, para que las barras respondan al instante. El backend guarda los resultados y aplica dinero, XP y reputación. Validar en el servidor no merece la pena en una hackathon.

---

## 3. Estructura del repositorio

```
frontend/
  src/
    data/          # catálogo: piezas.js, orbitas.js, misiones.js, tutorial.js
    engine/        # lógica pura: cohete.js (Δv, empuje/peso), satelite.js (potencia, datos),
                   # simulacion.js, puntuacion.js
    api/           # client.js (fetch + JWT), auth.js, jugador.js, misiones.js, sala.js (WebSocket)
    state/         # GameContext + reducer
    zones/         # Login/, Sede/, Hangar/ (Almacen, Laboratorio, Taller, Plataforma),
                   # CentroMisiones/, CentroControl/, Social/, Academia/
    tutorial/      # superposición de ORBI + pasos
    components/    # BarraRecurso, TarjetaPieza, Checklist, Modal...
backend/
  src/main/java/.../
    auth/          # registro, login, JWT, configuración de seguridad
    jugador/       # Jugador, Perfil, Conocimiento
    empresa/       # Empresa, Hangar, Inventario, plantillas de cohete
    social/        # Amistad
    mision/        # Gobierno, Mision, SesionMision, Participante, Resultado
    economia/      # pagos, reputación, préstamos
    sala/          # WebSocket: diseño compartido en tiempo real
  src/main/resources/
    application.yml
    data.sql       # catálogo inicial de misiones
```

---

## 4. API inicial

| Método | Ruta | Para qué |
|---|---|---|
| POST | `/api/auth/registro` | Correo, contraseña, nombre de usuario y nombre de empresa |
| POST | `/api/auth/login` | Devuelve el JWT |
| GET | `/api/jugador/me` | Jugador + perfil + empresa + conocimiento |
| PATCH | `/api/empresa` | Personalizar nombre, logo y colores |
| POST | `/api/hangar/comprar` | Comprar piezas (descuenta dinero) |
| GET / POST | `/api/hangar/plantillas` | Diseños de cohete guardados |
| GET | `/api/misiones` | Misiones disponibles según nivel y reputación |
| POST | `/api/misiones/{id}/aceptar` | Crea una SesionMision (SOLO o GRUPO) |
| POST | `/api/sesiones/{id}/resultado` | Guarda el resultado y aplica el pago, la XP y la reputación |
| GET / POST | `/api/amigos` | Lista de amigos y enviar solicitud |
| POST | `/api/amigos/{id}/aceptar` | Aceptar una solicitud |
| WS | `/ws` → `/topic/sala/{codigo}` | Cambios del diseño compartido, roles y "Listo" |

---

## 5. Fases

| Fase | Horas | Entregable | Prioridad |
|---|---|---|---|
| **0. Arranque** | 0–2 | Repo con `frontend/` y `backend/` funcionando, UML revisado, reparto de tareas | Imprescindible |
| **1. Núcleo** | 2–14 | ~~**Back:** registro, login, JWT, entidades JPA de jugador y empresa~~ ✅ hecho. **Front:** ~~login~~ ✅, `engine/` con las fórmulas de los 6 recursos, catálogo, navegación entre zonas, Hangar funcional con el **panel de recursos** | Imprescindible |
| **2. Misiones y economía** | 14–22 | Centro de Misiones, Centro de Control con lanzamiento animado, informe final; pago, XP, niveles, reputación y préstamo | Imprescindible |
| **3. Tutorial** | 22–28 | ORBI + los pasos de [02-TUTORIAL.md](02-TUTORIAL.md) | Imprescindible |
| **4. Social y multijugador** | 28–38 | Personalización de empresa y cohete, amigos, sala de grupo por WebSocket con roles y recursos compartidos | Importante |
| **5. Pulido** | 38–44 | Animaciones, eventos aleatorios (fallo de panel, tormenta solar…), 3–5 misiones más, Academia | Deseable |
| **6. Entrega** | 44–48 | Despliegue, vídeo de la demo, presentación, README | Imprescindible |

> Mientras el backend no esté listo, el frontend trabaja con **respuestas simuladas** dentro de `api/`, así nadie se queda esperando.

---

## 6. Reparto sugerido (4 personas)

| Persona | Responsabilidad principal | Fases |
|---|---|---|
| **P1 — Motor y datos** | `engine/`, `data/`, equilibrio de números, puntuación | 1, 2, 5 |
| **P2 — Hangar** | Almacén, Laboratorio, Taller (construcción y pintura), Plataforma | 1, 3 |
| **P3 — Misiones, control y tutorial** | Centro de Misiones, Centro de Control (animación), informe, ORBI | 2, 3, 5 |
| **P4 — Backend** | Spring Boot, H2, auth, economía, amigos, WebSocket | 1, 2, 4 |

Con 2 o 3 personas: se juntan P1 + P3, y P2 ayuda a P4 con el multijugador.

---

## 7. Reglas de juego iniciales (para equilibrar después)

| Regla | Valor inicial |
|---|---|
| Dinero inicial | 10 M$ |
| Reputación inicial | 50 / 100 |
| Piezas | Las paga el jugador |
| Misión cumplida | El Gobierno paga `recompensa × (puntuación / 100)` + XP · reputación +10 |
| Misión fallida | 0 M$, **30 % de la XP** · reputación −15 |
| Reputación < 30 | El Gobierno deja de pagar; solo misiones de prueba (XP y +15 de reputación) |
| Reputación ≥ 70 | Adelanto del 50 % del pago al aceptar |
| Sin dinero para el cohete más barato | Préstamo de rescate, que se descuenta de las siguientes recompensas |
| XP para subir al nivel *n + 1* | `100 × n` |
| Puntuación (0–100) | Objetivo cumplido 50 + valor científico 20 + eficiencia de recursos 20 + trabajo en equipo 10 |
| Misión de grupo | Cada jugador paga sus piezas; el pago se reparte según lo que aportó cada uno + bonus de equipo |

Detalle completo en [01-UML.md § 7 Economía](01-UML.md).

---

## 8. Riesgos

| Riesgo | Plan B |
|---|---|
| El WebSocket da problemas | Consulta al servidor cada 2 s (*polling*) con la misma API; funciona igual para 4 jugadores |
| El backend se retrasa | El frontend sigue con respuestas simuladas y se conecta al final |
| Los números no cuadran | P1 ajusta solo `data/`; nada de números dentro de componentes |
| La interfaz del Taller de cohetes se complica | Etapas como **lista vertical apilada** (añadir, quitar, reordenar) en vez de arrastrar y soltar libre |
| Se acaba el tiempo | Lo que vale en la demo son las prioridades "Imprescindible" |

---

## 9. Decisiones

**Tomadas**
- [x] Economía: el jugador paga las piezas; el Gobierno paga las misiones cumplidas; con reputación baja deja de pagar.
- [x] Multijugador en tiempo real.
- [x] Registro real con correo y contraseña.
- [x] Base de datos H2 → backend en Spring Boot.

**Pendientes**
- [ ] ¿Todo el equipo puede trabajar con Java/Spring, o solo una persona (P4)?
- [ ] Órbitas iniciales: LEO, SSO y GEO. ¿Añadimos la Luna como misión final?
- [ ] Nombre del juego y estilo visual (paleta, tipografía).
