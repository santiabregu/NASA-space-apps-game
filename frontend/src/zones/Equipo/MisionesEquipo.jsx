import { DoorOpen, LogIn, Mail, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { crearSala, obtenerInvitaciones, obtenerMiSala, unirseASala } from '../../api/salas.js'
import { EstrellaPixel } from '../../components/pixel/pixel.jsx'

// Las invitaciones llegan sin recargar: se consultan cada pocos segundos mientras la página está abierta.
const MS_ENTRE_CONSULTAS = 4000
const LARGO_CODIGO = 6

export default function MisionesEquipo({ catalogo, onAbrirSala }) {
  const [miSala, setMiSala] = useState(null)
  const [invitaciones, setInvitaciones] = useState([])
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    let activa = true
    async function consultar() {
      const [sala, recibidas] = await Promise.all([obtenerMiSala(), obtenerInvitaciones()]).catch(() => [null, []])
      if (!activa) return
      setMiSala(sala)
      setInvitaciones(recibidas)
    }
    consultar()
    const intervalo = setInterval(consultar, MS_ENTRE_CONSULTAS)
    return () => {
      activa = false
      clearInterval(intervalo)
    }
  }, [])

  async function entrar(accion) {
    setError(null)
    try {
      const sala = await accion()
      onAbrirSala(sala.codigo)
    } catch (excepcion) {
      setError(excepcion.message)
    }
  }

  return (
    <section className="cristal space-y-4 p-4">
      <div>
        <h2 className="flex items-center gap-2 font-display font-semibold">
          <Users className="h-5 w-5 text-cyan-300" /> Team missions
        </h2>
        <p className="text-sm text-slate-400">
          Build a space telescope with 2 to 4 friends. Each of you runs a department, chosen at random. The Government pays
          for the parts and everyone earns one for their own rocket.
        </p>
      </div>

      {error && <p className="rounded-lg bg-red-950/80 p-3 text-sm text-red-300">{error}</p>}

      {miSala && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-cyan-400/40 bg-cyan-950/40 p-3">
          <p className="flex-1 text-sm">
            You are in team <strong>{miSala.codigo}</strong> · {miSala.estrella} · {miSala.miembros.length} players
          </p>
          <button
            onClick={() => onAbrirSala(miSala.codigo)}
            className="flex items-center gap-1.5 rounded-lg bg-cyan-400 px-3 py-1.5 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
          >
            <DoorOpen className="h-4 w-4" /> Open team room
          </button>
        </div>
      )}

      {invitaciones.map((invitacion) => (
        <div key={invitacion.codigo} className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-300/40 bg-amber-950/40 p-3">
          <Mail className="h-5 w-5 shrink-0 text-amber-300" />
          <p className="flex-1 text-sm">
            <strong>{invitacion.anfitrion}</strong> invites you to observe {invitacion.estrella} ({invitacion.miembros} / 4)
          </p>
          <button
            onClick={() => entrar(() => unirseASala(invitacion.codigo))}
            className="rounded-lg bg-amber-300 px-3 py-1.5 text-sm font-semibold text-slate-950 hover:bg-amber-200"
          >
            Join
          </button>
        </div>
      ))}

      <div className="space-y-2">
        <h3 className="text-sm text-slate-300">Create a team: choose the star to observe</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {catalogo.estrellas.map((estrella) => (
            <button
              key={estrella.id}
              onClick={() => entrar(() => crearSala(estrella.id))}
              className="flex items-center gap-3 rounded-xl border border-slate-400/20 bg-slate-900/60 p-3 text-left transition hover:-translate-y-0.5 hover:border-cyan-400/70"
            >
              <EstrellaPixel id={estrella.id} className="h-14 w-14 shrink-0" />
              <span className="min-w-0">
                <span className="block font-semibold">{estrella.nombre}</span>
                <span className="block text-xs text-slate-400">
                  {estrella.tipo} · {estrella.distancia}
                </span>
                <span className="block text-xs text-amber-200">{estrella.reto}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <form
        onSubmit={(evento) => {
          evento.preventDefault()
          entrar(() => unirseASala(codigo.trim()))
        }}
        className="flex flex-wrap gap-2"
      >
        <input
          value={codigo}
          onChange={(evento) => setCodigo(evento.target.value.toUpperCase())}
          placeholder="Team code"
          maxLength={LARGO_CODIGO}
          className="w-40 rounded-lg border border-slate-400/30 bg-slate-950/60 px-3 py-2 uppercase tracking-widest outline-none focus:border-cyan-400"
        />
        <button
          disabled={codigo.trim().length !== LARGO_CODIGO}
          className="flex items-center gap-1.5 rounded-lg border border-slate-400/40 px-4 py-2 hover:bg-slate-800/60 disabled:opacity-40"
        >
          <LogIn className="h-4 w-4" /> Join with code
        </button>
      </form>
    </section>
  )
}
