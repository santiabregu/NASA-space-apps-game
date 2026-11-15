import { guardarToken, pedir } from './client.js'

// Con el nombre y la empresa se empieza una partida nueva o se continúa la que ya existe.
export async function entrar(datos) {
  const { token } = await pedir('/api/auth/entrar', { metodo: 'POST', cuerpo: datos })
  guardarToken(token)
}
