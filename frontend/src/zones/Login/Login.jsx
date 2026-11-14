import { useState } from 'react'
import { iniciarSesion, registrar } from '../../api/auth.js'

const CAMPOS_REGISTRO = { email: '', password: '', nombreUsuario: '', nombreEmpresa: '' }

export default function Login({ onEntrar, aviso }) {
  const [modo, setModo] = useState('login')
  const [datos, setDatos] = useState(CAMPOS_REGISTRO)
  const [error, setError] = useState(aviso)
  const [enviando, setEnviando] = useState(false)
  const esRegistro = modo === 'registro'

  const cambiar = (campo) => (evento) => setDatos({ ...datos, [campo]: evento.target.value })

  async function enviar(evento) {
    evento.preventDefault()
    setEnviando(true)
    setError(null)
    try {
      if (esRegistro) await registrar(datos)
      else await iniciarSesion({ email: datos.email, password: datos.password })
      await onEntrar()
    } catch (excepcion) {
      setError(excepcion.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={enviar}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl"
      >
        <header className="text-center">
          <p className="text-4xl">🚀</p>
          <h1 className="mt-2 text-2xl font-bold">Misión Espacial</h1>
          <p className="text-sm text-slate-400">
            {esRegistro ? 'Funda tu empresa espacial' : 'Vuelve a tu centro de control'}
          </p>
        </header>

        <Campo etiqueta="Correo" type="email" value={datos.email} onChange={cambiar('email')} autoComplete="email" />
        <Campo
          etiqueta="Contraseña"
          type="password"
          value={datos.password}
          onChange={cambiar('password')}
          minLength={esRegistro ? 8 : undefined}
          autoComplete={esRegistro ? 'new-password' : 'current-password'}
        />
        {esRegistro && (
          <>
            <Campo etiqueta="Nombre de usuario" value={datos.nombreUsuario} onChange={cambiar('nombreUsuario')} minLength={3} maxLength={20} />
            <Campo etiqueta="Nombre de tu empresa" value={datos.nombreEmpresa} onChange={cambiar('nombreEmpresa')} minLength={2} maxLength={40} />
          </>
        )}

        {error && <p className="rounded-lg bg-red-950 p-3 text-sm text-red-300">{error}</p>}

        <button
          disabled={enviando}
          className="w-full rounded-lg bg-cyan-500 py-2 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
        >
          {esRegistro ? 'Crear cuenta' : 'Entrar'}
        </button>
        <button
          type="button"
          onClick={() => setModo(esRegistro ? 'login' : 'registro')}
          className="w-full text-sm text-slate-400 hover:text-slate-200"
        >
          {esRegistro ? '¿Ya tienes cuenta? Inicia sesión' : '¿Nuevo? Crea tu cuenta'}
        </button>
      </form>
    </main>
  )
}

function Campo({ etiqueta, ...props }) {
  return (
    <label className="block text-sm">
      <span className="text-slate-300">{etiqueta}</span>
      <input
        required
        {...props}
        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-cyan-400"
      />
    </label>
  )
}
