import { pedir } from './client.js'

export const obtenerAmigos = () => pedir('/api/amigos')

export const buscarJugadores = (texto) => pedir(`/api/amigos/buscar?texto=${encodeURIComponent(texto)}`)

export const pedirAmistad = (nombreUsuario) => pedir('/api/amigos/solicitudes', { metodo: 'POST', cuerpo: { nombreUsuario } })

export const aceptarAmistad = (amistadId) => pedir(`/api/amigos/${amistadId}/aceptar`, { metodo: 'POST' })

// Rechaza una solicitud recibida, cancela una enviada o deja de ser amigos.
export const borrarAmistad = (amistadId) => pedir(`/api/amigos/${amistadId}`, { metodo: 'DELETE' })
