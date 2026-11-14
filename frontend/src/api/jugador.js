import { pedir } from './client.js'

export const obtenerJugador = () => pedir('/api/jugador/me')
