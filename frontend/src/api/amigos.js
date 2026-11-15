import { pedir } from './client.js'

export const obtenerAmigos = () => pedir('/api/amigos')

export const buscarJugadores = (texto) => pedir(`/api/amigos/buscar?texto=${encodeURIComponent(texto)}`)

// Por id: dos jugadores pueden llamarse igual si su empresa es distinta.
export const pedirAmistad = (jugadorId) => pedir('/api/amigos/solicitudes', { metodo: 'POST', cuerpo: { jugadorId } })

export const aceptarAmistad = (amistadId) => pedir(`/api/amigos/${amistadId}/aceptar`, { metodo: 'POST' })

// Rechaza una solicitud recibida, cancela una enviada o deja de ser amigos.
export const borrarAmistad = (amistadId) => pedir(`/api/amigos/${amistadId}`, { metodo: 'DELETE' })
