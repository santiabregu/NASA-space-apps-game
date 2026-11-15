import { Check, Clock, Search, UserMinus, UserPlus, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { aceptarAmistad, borrarAmistad, buscarJugadores, obtenerAmigos, pedirAmistad } from '../../api/amigos.js'
import MisionesEquipo from '../Equipo/MisionesEquipo.jsx'

const MINIMO_BUSQUEDA = 2

export default function Social({ jugador, catalogo, onIrA, onAbrirSala }) {
  const [amigos, setAmigos] = useState(null)
  const [texto, setTexto] = useState('')
  const [resultados, setResultados] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    obtenerAmigos().then(setAmigos, (excepcion) => setError(excepcion.message))
  }, [])

  // Cada acción devuelve la lista completa actualizada; la búsqueda se repite para refrescar su estado.
  async function ejecutar(accion) {
    setError(null)
    try {
      setAmigos(await accion())
      if (resultados) setResultados(await buscarJugadores(texto.trim()))
    } catch (excepcion) {
      setError(excepcion.message)
    }
  }

  async function buscar(evento) {
    evento.preventDefault()
    setError(null)
    try {
      setResultados(await buscarJugadores(texto.trim()))
    } catch (excepcion) {
      setError(excepcion.message)
    }
  }

  if (!amigos) {
    return <p className="p-8 text-center text-slate-400">{error ?? 'Loading your contacts…'}</p>
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <header>
        <h1 className="font-display text-2xl font-bold">Friends</h1>
        <p className="text-slate-400">Add other space companies as friends to fly team missions together.</p>
      </header>

      <MisionesEquipo jugador={jugador} catalogo={catalogo} onIrA={onIrA} onAbrirSala={onAbrirSala} />

      {error && <p className="rounded-lg bg-red-950/80 p-3 text-sm text-red-300">{error}</p>}

      <section className="cristal space-y-3 p-4">
        <form onSubmit={buscar} className="flex gap-2">
          <input
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
            placeholder="Search players by username"
            maxLength={30}
            className="min-w-0 flex-1 rounded-lg border border-slate-400/30 bg-slate-950/60 px-3 py-2 outline-none focus:border-cyan-400"
          />
          <button
            disabled={texto.trim().length < MINIMO_BUSQUEDA}
            className="flex items-center gap-1.5 rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-40"
          >
            <Search className="h-4 w-4" /> Search
          </button>
        </form>
        {resultados && resultados.length === 0 && <p className="text-sm text-slate-400">Nobody found with that name.</p>}
        {resultados?.map(({ jugador, relacion }) => (
          <Fila key={jugador.id} jugador={jugador}>
            <AccionBusqueda
              relacion={relacion}
              onPedir={() => ejecutar(() => pedirAmistad(jugador.nombreUsuario))}
              onAceptar={() => {
                const solicitud = amigos.recibidas.find((contacto) => contacto.jugador.id === jugador.id)
                if (solicitud) ejecutar(() => aceptarAmistad(solicitud.amistadId))
              }}
            />
          </Fila>
        ))}
      </section>

      {amigos.recibidas.length > 0 && (
        <Seccion titulo={`Friend requests · ${amigos.recibidas.length}`}>
          {amigos.recibidas.map(({ amistadId, jugador }) => (
            <Fila key={amistadId} jugador={jugador}>
              <Boton Icono={Check} principal onClick={() => ejecutar(() => aceptarAmistad(amistadId))}>
                Accept
              </Boton>
              <Boton Icono={X} onClick={() => ejecutar(() => borrarAmistad(amistadId))}>
                Decline
              </Boton>
            </Fila>
          ))}
        </Seccion>
      )}

      <Seccion titulo={`Your friends · ${amigos.amigos.length}`}>
        {amigos.amigos.length === 0 && (
          <p className="flex items-center gap-2 text-sm text-slate-400">
            <Users className="h-4 w-4" /> No friends yet. Search for a player above and send a request.
          </p>
        )}
        {amigos.amigos.map(({ amistadId, jugador }) => (
          <Fila key={amistadId} jugador={jugador}>
            <BotonQuitar onConfirmar={() => ejecutar(() => borrarAmistad(amistadId))} />
          </Fila>
        ))}
      </Seccion>

      {amigos.enviadas.length > 0 && (
        <Seccion titulo="Requests you sent">
          {amigos.enviadas.map(({ amistadId, jugador }) => (
            <Fila key={amistadId} jugador={jugador}>
              <span className="flex items-center gap-1 text-sm text-slate-400">
                <Clock className="h-4 w-4" /> Waiting
              </span>
              <Boton Icono={X} onClick={() => ejecutar(() => borrarAmistad(amistadId))}>
                Cancel
              </Boton>
            </Fila>
          ))}
        </Seccion>
      )}
    </main>
  )
}

function Seccion({ titulo, children }) {
  return (
    <section className="cristal space-y-3 p-4">
      <h2 className="font-display font-semibold">{titulo}</h2>
      {children}
    </section>
  )
}

function Fila({ jugador, children }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-900/60 p-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-950 font-display font-bold text-cyan-300">
        {jugador.nombreUsuario.charAt(0).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{jugador.nombreUsuario}</p>
        <p className="text-sm text-slate-400">
          {jugador.empresa} · Level {jugador.nivel} · {jugador.destinosAlcanzados}{' '}
          {jugador.destinosAlcanzados === 1 ? 'destination' : 'destinations'} reached
        </p>
      </div>
      <div className="flex gap-2">{children}</div>
    </div>
  )
}

function AccionBusqueda({ relacion, onPedir, onAceptar }) {
  if (relacion === 'AMIGO') {
    return (
      <span className="flex items-center gap-1 text-sm text-emerald-300">
        <Check className="h-4 w-4" /> Friends
      </span>
    )
  }
  if (relacion === 'ENVIADA') {
    return (
      <span className="flex items-center gap-1 text-sm text-slate-400">
        <Clock className="h-4 w-4" /> Request sent
      </span>
    )
  }
  if (relacion === 'RECIBIDA') {
    return (
      <Boton Icono={Check} principal onClick={onAceptar}>
        Accept request
      </Boton>
    )
  }
  return (
    <Boton Icono={UserPlus} principal onClick={onPedir}>
      Add friend
    </Boton>
  )
}

// Dejar de ser amigos pide un segundo clic para evitar errores.
function BotonQuitar({ onConfirmar }) {
  const [seguro, setSeguro] = useState(false)
  if (!seguro) {
    return (
      <Boton Icono={UserMinus} onClick={() => setSeguro(true)}>
        Remove
      </Boton>
    )
  }
  return (
    <>
      <Boton Icono={UserMinus} peligro onClick={onConfirmar}>
        Yes, remove
      </Boton>
      <Boton Icono={X} onClick={() => setSeguro(false)}>
        Keep
      </Boton>
    </>
  )
}

function Boton({ Icono, principal = false, peligro = false, onClick, children }) {
  let estilo = 'border border-slate-400/40 text-slate-200 hover:bg-slate-800/60'
  if (principal) estilo = 'bg-cyan-400 font-semibold text-slate-950 hover:bg-cyan-300'
  if (peligro) estilo = 'bg-red-500 font-semibold text-white hover:bg-red-400'
  return (
    <button onClick={onClick} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm ${estilo}`}>
      <Icono className="h-4 w-4" /> {children}
    </button>
  )
}
