# Tutorial — "Misión 0: Tu primer satélite"

> Versión 0.1 · borrador para revisión.

**Objetivo del tutorial:** construir un cohete pequeño, montar un CubeSat y ponerlo en **órbita baja (LEO, 400 km)**.
**La misión termina** cuando el satélite se despliega en órbita.
**Duración objetivo:** 5–7 minutos.

**Guía:** **ORBI**, la IA del centro de control. Habla en mensajes cortos, señala la zona de la pantalla de la que habla y nunca da más de una idea por paso.

---

## Mapa del juego (lo que enseña el tutorial)

### Zonas principales

| Zona | Para qué sirve |
|---|---|
| 🏢 **Sede** | Tu empresa: nombre, logo, colores, dinero, nivel y barra de conocimiento |
| 🛠️ **Hangar** | Donde construyes satélites y cohetes (tiene 4 zonas internas) |
| 🏛️ **Centro de Misiones** | El Gobierno publica misiones; eliges una según tus recursos y si la harás **solo o en grupo** |
| 📡 **Centro de Control** | Sigues el lanzamiento y la operación de la misión en directo |
| 👥 **Social** | Amigos, invitaciones y misiones de grupo *(se desbloquea al acabar el tutorial)* |
| 📚 **Academia** | Glosario y explicaciones de conceptos (Δv, órbita, potencia…) |

### Zonas del Hangar

| Zona | Para qué sirve |
|---|---|
| 📦 **Almacén** | Piezas disponibles, su precio y sus características |
| 🔬 **Laboratorio de satélites** | Montar la carga útil: estructura, energía, comunicaciones, instrumentos |
| 🚀 **Taller de cohetes** | El espacio de construcción: apilar etapas, motores, tanques, cofia, y pintar el cohete |
| 🟢 **Plataforma de lanzamiento** | Checklist final y botón de lanzar |

---

## Pasos

| # | Zona | Qué hace el jugador | Qué aprende | Condición para avanzar |
|---|---|---|---|---|
| 0 | Registro | Crea su cuenta con correo y contraseña | — | Cuenta creada |
| 1 | Bienvenida | Pone nombre a su empresa y elige colores y logo | Que es dueño/a de una empresa espacial | Nombre escrito |
| 2 | Sede | Mira las barras de dinero, nivel, conocimiento y reputación | **Tú pagas las piezas** y el Gobierno paga si la misión sale bien. Si fallas mucho, baja tu reputación y deja de pagarte | Pulsar "Entendido" |
| 3 | Centro de Misiones | Abre el contrato del Gobierno "Misión 0" y lo acepta en modo **Solo** | Cada misión tiene objetivo, requisitos y recompensa. El botón "Grupo" aparece bloqueado, con el texto *"Disponible al terminar el tutorial"* | Misión aceptada |
| 4 | Hangar → Almacén | **Compra** las piezas del tutorial con su dinero (≈ 6,8 M$ de 10 M$) | Cada pieza tiene **masa, coste y potencia**, y todo suma | Piezas compradas |
| 5 | Laboratorio | Monta un CubeSat 3U: estructura + panel solar + batería + ordenador + antena | **Balance de potencia:** el panel tiene que generar más de lo que se consume, y la batería cubre el tiempo en la sombra de la Tierra | Barra de potencia en verde |
| 6 | Taller de cohetes | Pone **solo la etapa 1** + cofia con el satélite | — | — |
| 7 | Taller de cohetes | Ve que la barra de **Δv** se queda corta (≈ 6,8 de 9,4 km/s). ORBI lo explica | **Δv:** lo que hace falta para llegar a órbita. Una sola etapa carga con demasiado peso muerto | Pulsar "¿Cómo lo arreglo?" |
| 8 | Taller de cohetes | Añade la **etapa 2** → la barra de Δv pasa a verde (≈ 10,6 km/s) | Por qué los cohetes tienen **varias etapas** | Δv ≥ 9,4 km/s |
| 9 | Taller de cohetes | Pinta el cohete con los colores de la empresa | Personalización | Opcional ("Saltar") |
| 10 | Plataforma | Revisa la checklist: masa ✅, potencia ✅, presupuesto ✅, Δv ✅, empuje/peso ✅ | Antes de lanzar se comprueba todo | Pulsar **LANZAR** |
| 11 | Centro de Control | Ve el despegue → separación de etapa 1 → encendido de etapa 2 → separación de cofia → inserción orbital | Las fases de un lanzamiento | Animación terminada |
| 12 | Centro de Control | **"🛰️ Satélite desplegado en órbita a 400 km"** → **FIN DE LA MISIÓN** | — | — |
| 13 | Informe | El Gobierno paga **+12 M$**; gana **+100 XP** (**sube a nivel 2**) y **+10 de reputación**. Se desbloquean **Social** y las **misiones de grupo** | Qué hizo bien y por qué | Pulsar "Volver a la Sede" |

> El **error guiado del paso 7** es intencionado: el jugador aprende más viendo que una etapa no basta que leyendo una explicación.

---

## Datos de juego del tutorial

Son valores simplificados, inspirados en lanzadores pequeños reales.

### Satélite (CubeSat 3U)

| Pieza | Masa | Potencia | Coste |
|---|---|---|---|
| Estructura 3U | 1,5 kg | 0 W | 0,1 M$ |
| Panel solar desplegable | 0,5 kg | **+8 W** | 0,15 M$ |
| Batería 20 Wh | 0,4 kg | 0 W | 0,05 M$ |
| Ordenador de a bordo | 0,3 kg | −1,5 W | 0,1 M$ |
| Antena UHF | 0,3 kg | −2 W | 0,1 M$ |
| **Total** | **≈ 3 kg** | **+4,5 W ✅** | **0,5 M$** |

### Cohete

| Pieza | Masa vacía | Combustible | Empuje | Isp | Coste |
|---|---|---|---|---|---|
| Cofia | 50 kg | — | — | — | 0,3 M$ |
| Etapa 2 (motor + tanque) | 250 kg | 2.000 kg | 25 kN | 340 s | 2 M$ |
| Etapa 1 (motor + tanque) | 950 kg | 9.000 kg | 190 kN | 300 s | 4 M$ |

- **Fórmula** (ecuación del cohete, por etapa): `Δv = Isp × 9,81 × ln(masa inicial / masa final)`
- **Solo etapa 1:** ≈ 6,8 km/s ❌ · **Etapas 1 + 2:** ≈ 10,6 km/s ✅ · **Necesario para LEO:** 9,4 km/s (incluye pérdidas por gravedad y por el aire)
- **Empuje/peso al despegar:** 190 kN / (12.250 kg × 9,81) ≈ **1,6** ✅ (tiene que ser > 1,2)
- **Coste total de las piezas:** ≈ 6,8 M$ · **Dinero inicial:** 10 M$ · **Al terminar:** ≈ 15,2 M$

---

## Reglas de diseño del tutorial

- Se puede **saltar** (para quien ya lo hizo), pero en el primer acceso es obligatorio.
- Las zonas que no se usan todavía están **atenuadas**, no ocultas, para que el jugador sepa que existen.
- El **panel de los 6 recursos** (masa, potencia, presupuesto, datos, comunicaciones, tiempo) está siempre visible en el Hangar. En el tutorial, ORBI solo explica los que usa cada paso; los demás aparecen atenuados.
- Cada concepto nuevo se guarda en la **Academia** para poder repasarlo.
- Al terminar, `Perfil.tutorialCompletado = true`.
