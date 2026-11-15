import { useState } from 'react'
import { entrar } from '../../api/auth.js'
import { LOGOS } from '../../logos.js'

// Sin cuentas ni contraseñas: el nombre y la empresa identifican la partida.
export default function Login({ onEntrar, aviso }) {
  const [datos, setDatos] = useState({ nombreUsuario: '', nombreEmpresa: '' })
  const [error, setError] = useState(aviso)
  const [enviando, setEnviando] = useState(false)

  const cambiar = (campo) => (evento) => setDatos({ ...datos, [campo]: evento.target.value })

  async function enviar(evento) {
    evento.preventDefault()
    setEnviando(true)
    setError(null)
    try {
      await entrar(datos)
      await onEntrar()
    } catch (excepcion) {
      setError(excepcion.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-4 md:justify-start md:px-24">
      <form onSubmit={enviar} className="cristal w-full max-w-sm space-y-[min(1rem,1.8vh)] p-[min(1.75rem,3vh)] shadow-2xl">
        <header className="text-center">
          <img src={LOGOS.logoJuego} alt="" className="mx-auto w-[min(9rem,15vh)]" />
          <h1 className="mt-3 whitespace-nowrap font-display text-2xl font-extrabold tracking-wide">STELLAR STRATEGY</h1>
          <p className="text-sm text-slate-400">Found your space company and start playing</p>
        </header>

        <Campo etiqueta="Your name" value={datos.nombreUsuario} onChange={cambiar('nombreUsuario')} minLength={3} maxLength={20} autoComplete="nickname" />
        <Campo etiqueta="Company name" value={datos.nombreEmpresa} onChange={cambiar('nombreEmpresa')} minLength={2} maxLength={40} autoComplete="organization" />

        {error && <p className="rounded-lg bg-red-950/80 p-3 text-sm text-red-300">{error}</p>}

        <button
          disabled={enviando}
          className="w-full rounded-lg bg-cyan-400 py-2.5 font-bold text-slate-950 shadow-[0_0_24px_rgba(34,211,238,.35)] transition hover:bg-cyan-300 disabled:opacity-50"
        >
          {enviando ? 'Connecting…' : 'Play'}
        </button>
        <p className="text-center text-xs text-slate-400">
          Coming back? Type the same name and company to continue where you left off.
        </p>
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
