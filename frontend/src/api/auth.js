import { guardarToken, pedir } from './client.js'

export async function registrar(datos) {
  const { token } = await pedir('/api/auth/registro', { metodo: 'POST', cuerpo: datos })
  guardarToken(token)
}

export async function iniciarSesion(credenciales) {
  const { token } = await pedir('/api/auth/login', { metodo: 'POST', cuerpo: credenciales })
  guardarToken(token)
}
