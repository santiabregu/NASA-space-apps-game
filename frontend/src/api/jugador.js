import { pedir } from './client.js'

export const obtenerJugador = () => pedir('/api/jugador/me')

export const marcarIntroVista = () => pedir('/api/jugador/intro', { metodo: 'POST' })
