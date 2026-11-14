import { pedir } from './client.js'

const ruta = (codigo, accion = '') => `/api/salas/${encodeURIComponent(codigo)}${accion}`

export const crearSala = (estrellaId) => pedir('/api/salas', { metodo: 'POST', cuerpo: { estrellaId } })

// null si el jugador no está en ninguna sala.
export const obtenerMiSala = () => pedir('/api/salas/mia')

export const obtenerInvitaciones = () => pedir('/api/salas/invitaciones')

// null si la sala sigue en la versión que ya tenemos.
export const verSala = (codigo, version) => pedir(ruta(codigo, version == null ? '' : `?version=${version}`))

export const unirseASala = (codigo) => pedir(ruta(codigo, '/unirse'), { metodo: 'POST' })

export const invitarASala = (codigo, jugadorId) => pedir(ruta(codigo, '/invitar'), { metodo: 'POST', cuerpo: { jugadorId } })

export const salirDeSala = (codigo) => pedir(ruta(codigo, '/salir'), { metodo: 'POST' })

export const empezarSala = (codigo) => pedir(ruta(codigo, '/empezar'), { metodo: 'POST' })

// datos es un objeto JSON pequeño que depende del minijuego de cada departamento.
export const enviarProgreso = (codigo, departamento, datos) =>
  pedir(ruta(codigo, `/fases/${departamento}/progreso`), { metodo: 'POST', cuerpo: { datos } })

export const enviarResultado = (codigo, departamento, datos) =>
  pedir(ruta(codigo, `/fases/${departamento}/resultado`), { metodo: 'POST', cuerpo: { datos } })

// piezaIds sustituye a los votos anteriores del jugador en esta fase.
export const votarPiezas = (codigo, departamento, piezaIds) =>
  pedir(ruta(codigo, `/fases/${departamento}/votos`), { metodo: 'POST', cuerpo: { piezaIds } })

// informe: los eventos del vuelo y una línea por departamento, calculados con el motor de simulación.
export const lanzarMision = (codigo, exito, informe) =>
  pedir(ruta(codigo, '/lanzamiento'), { metodo: 'POST', cuerpo: { exito, informe } })
