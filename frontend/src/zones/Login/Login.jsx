import { useState } from 'react'
import { iniciarSesion, registrar } from '../../api/auth.js'
import { LOGOS } from '../../logos.js'

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
    <main className="flex min-h-screen items-center justify-center px-4 md:justify-start md:px-24">
      <form onSubmit={enviar} className="cristal w-full max-w-sm space-y-4 p-7 shadow-2xl">
        <header className="text-center">
          <img src={LOGOS.logoJuego} alt="" className="mx-auto w-36" />
          <h1 className="mt-3 whitespace-nowrap font-display text-2xl font-extrabold tracking-wide">STELLAR STRATEGY</h1>
          <p className="text-sm text-slate-400">
            {esRegistro ? 'Found your space company' : 'Welcome back to mission control'}
          </p>
        </header>

        <Campo etiqueta="Email" type="email" value={datos.email} onChange={cambiar('email')} autoComplete="email" />
        <Campo
          etiqueta="Password"
          type="password"
          value={datos.password}
          onChange={cambiar('password')}
          minLength={esRegistro ? 8 : undefined}
          autoComplete={esRegistro ? 'new-password' : 'current-password'}
        />
        {esRegistro && (
          <>
            <Campo etiqueta="Username" value={datos.nombreUsuario} onChange={cambiar('nombreUsuario')} minLength={3} maxLength={20} />
            <Campo etiqueta="Company name" value={datos.nombreEmpresa} onChange={cambiar('nombreEmpresa')} minLength={2} maxLength={40} />
          </>
        )}

        {error && <p className="rounded-lg bg-red-950/80 p-3 text-sm text-red-300">{error}</p>}

        <button
          disabled={enviando}
          className="w-full rounded-lg bg-cyan-400 py-2.5 font-bold text-slate-950 shadow-[0_0_24px_rgba(34,211,238,.35)] transition hover:bg-cyan-300 disabled:opacity-50"
        >
          {esRegistro ? 'Create account' : 'Log in'}
        </button>
        <button
          type="button"
          onClick={() => setModo(esRegistro ? 'login' : 'registro')}
          className="w-full text-sm text-slate-400 hover:text-slate-200"
        >
          {esRegistro ? 'Already have an account? Log in' : 'New here? Create an account'}
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
        className="mt-1 w-full rounded-lg border border-slate-400/20 bg-slate-950/70 px-3 py-2 outline-none focus:border-cyan-400"
      />
    </label>
  )
}
