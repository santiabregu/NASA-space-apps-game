import { Copy, Crown, LogOut, UserPlus } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { obtenerAmigos } from '../../api/amigos.js'
import { obtenerJugador } from '../../api/jugador.js'
import { empezarSala, invitarASala, salirDeSala, verSala } from '../../api/salas.js'
import { BOTON_PIXEL, CAJA_PIXEL } from '../../components/pixel/estilos.js'
import { CieloPixel, EstrellaPixel } from '../../components/pixel/pixel.jsx'
import { DEPARTAMENTOS, responsableDe } from './departamentos.js'
import { FaseEnCurso } from './Fases.jsx'
import { LanzamientoEquipo, PlataformaEquipo } from './Lanzamiento.jsx'

// Cada navegador pregunta por la sala con la versión que ya tiene; si no ha cambiado, el servidor no manda nada.
const MS_ENTRE_CONSULTAS = 1500
const PLAZAS = 4
const MINIMO_PARA_EMPEZAR = 2
const MS_ENTRE_TICS = 250

// desfase es lo que va el reloj del servidor por delante del nuestro: así todos ven la misma cuenta atrás.
function useSala(codigo) {
  const [sala, setSala] = useState(null)
  const [error, setError] = useState(null)
  const version = useRef(null)

  const recibir = useCallback((nueva) => {
    version.current = nueva.version
    setSala({ ...nueva, desfase: nueva.ahora - Date.now() })
  }, [])

  useEffect(() => {
    let activa = true
    async function consultar() {
      try {
        const nueva = await verSala(codigo, version.current)
        if (activa && nueva) recibir(nueva)
      } catch (excepcion) {
        if (activa) setError(excepcion.message)
      }
    }
    consultar()
    const intervalo = setInterval(consultar, MS_ENTRE_CONSULTAS)
    return () => {
      activa = false
      clearInterval(intervalo)
    }
  }, [codigo, recibir])

  return { sala, recibir, error }
}

// La hora del servidor, recalculada varias veces por segundo para las cuentas atrás.
function useAhoraDelServidor(desfase) {
  const [ahora, setAhora] = useState(() => Date.now() + desfase)

  useEffect(() => {
    const intervalo = setInterval(() => setAhora(Date.now() + desfase), MS_ENTRE_TICS)
    return () => clearInterval(intervalo)
  }, [desfase])

  return ahora
}

export default function SalaEquipo({ codigo, jugador, catalogo, onSalir, onJugadorActualizado }) {
  const { sala, recibir, error } = useSala(codigo)
  const [errorAccion, setErrorAccion] = useState(null)
  const lanzada = sala?.estado === 'LANZADA'

  // Al lanzar, el servidor ya ha dado a cada uno su pieza o le ha quitado días: hay que traer el jugador al día.
  useEffect(() => {
    if (lanzada) obtenerJugador().then(onJugadorActualizado, () => null)
  }, [lanzada, onJugadorActualizado])

  async function ejecutar(accion) {
    setErrorAccion(null)
    try {
      const nueva = await accion()
      if (nueva) recibir(nueva)
    } catch (excepcion) {
      setErrorAccion(excepcion.message)
    }
  }

  async function salir() {
    await salirDeSala(codigo).catch(() => null)
    onSalir()
  }

  // En escritorio la sala ocupa justo lo que deja la barra de navegación (h-14) y la página no hace scroll:
  // lo que no cabe se desplaza dentro de su propio panel.
  return (
    <main className="relative flex flex-col font-pixel text-[#fff1e8] md:h-[calc(100dvh-3.5rem)] md:overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <CieloPixel />
      </div>
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-4">
        {error && (
          <div className={`${CAJA_PIXEL} space-y-4 p-6 text-xs leading-6`}>
            <p>{error}</p>
            <button onClick={onSalir} className={`${BOTON_PIXEL} bg-[#c2c3c7]`}>
              Back
            </button>
          </div>
        )}
        {!error && !sala && <p className="text-center text-xs">Connecting to your team...</p>}
        {!error && sala && (
          <>
            {sala.estado === 'ESPERA' ? (
              <SalaDeEspera sala={sala} jugador={jugador} catalogo={catalogo} onAccion={ejecutar} onSalir={salir} />
            ) : (
              <CabeceraCompacta sala={sala} catalogo={catalogo} onSalir={salir} />
            )}
            {sala.estado === 'EN_JUEGO' && <Partida sala={sala} jugador={jugador} catalogo={catalogo} onAccion={ejecutar} />}
            {sala.estado === 'TERMINADA' && <PlataformaEquipo sala={sala} jugador={jugador} catalogo={catalogo} onAccion={ejecutar} />}
            {lanzada && <LanzamientoEquipo sala={sala} jugador={jugador} catalogo={catalogo} onSalir={salir} />}
            {errorAccion && <p className="shrink-0 text-[8px] leading-4 text-[#ff004d]">{errorAccion}</p>}
          </>
        )}
      </div>
    </main>
  )
}

// Durante la partida la ficha de la estrella se reduce a una línea, con la salida siempre a mano.
function CabeceraCompacta({ sala, catalogo, onSalir }) {
  const estrella = catalogo.estrellas.find((candidata) => candidata.id === sala.estrellaId)
  return (
    <section className={`${CAJA_PIXEL} flex shrink-0 items-center gap-3 p-2`}>
      <EstrellaPixel id={estrella.id} className="h-8 w-8 shrink-0" />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-[8px] sm:text-base">{estrella.nombre}</p>
        <p className="truncate font-sans text-xs text-[#ffec27]">{estrella.reto}</p>
      </div>
      <button onClick={onSalir} className="flex shrink-0 items-center gap-2 border-4 border-black bg-[#c2c3c7] px-2 py-1 text-[8px] text-black">
        <LogOut className="h-3 w-3" /> Leave
      </button>
    </section>
  )
}

function Cabecera({ sala, catalogo }) {
  const estrella = catalogo.estrellas.find((candidata) => candidata.id === sala.estrellaId)
  return (
    <section className={`${CAJA_PIXEL} flex shrink-0 gap-4 p-4`}>
      <EstrellaPixel id={estrella.id} className="h-20 w-20 shrink-0 self-center drop-shadow-[0_0_18px_rgba(255,163,0,.45)]" />
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-[8px] text-[#ffec27]">Team mission · space telescope</p>
        <h1 className="text-base">{estrella.nombre}</h1>
        <p className="text-[8px] leading-4 text-[#c2c3c7]">
          {estrella.tipo} · {estrella.distancia}
        </p>
        <p className="font-sans text-sm text-slate-200">{estrella.descripcion}</p>
        <p className="font-sans text-sm text-[#ffec27]">Challenge: {estrella.reto}</p>
      </div>
    </section>
  )
}

function SalaDeEspera({ sala, jugador, catalogo, onAccion, onSalir }) {
  const soyAnfitrion = sala.anfitrionId === jugador.id
  const anfitrion = sala.miembros.find((miembro) => miembro.jugadorId === sala.anfitrionId)
  const plazasLibres = Array.from({ length: PLAZAS - sala.miembros.length })
  const [copiado, setCopiado] = useState(false)

  async function copiarCodigo() {
    await navigator.clipboard.writeText(sala.codigo).catch(() => null)
    setCopiado(true)
  }

  return (
    <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1fr_20rem]">
      <div className="flex min-h-0 flex-col gap-4">
        <Cabecera sala={sala} catalogo={catalogo} />
        <section className={`${CAJA_PIXEL} space-y-4 p-4`}>
        <h2 className="text-xs sm:text-base">Crew · {sala.miembros.length} / {PLAZAS}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {sala.miembros.map((miembro) => (
            <div key={miembro.jugadorId} className="flex items-center gap-3 border-4 border-black bg-[#0b1430] p-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center border-4 border-black bg-[#29adff] text-sm text-black">
                {miembro.nombreUsuario.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-1 truncate text-[8px] sm:text-xs">
                  {miembro.jugadorId === sala.anfitrionId && <Crown className="h-3 w-3 shrink-0 text-[#ffec27]" />}
                  {miembro.nombreUsuario}
                </p>
                <p className="truncate font-sans text-xs text-slate-400">{miembro.empresa}</p>
              </div>
            </div>
          ))}
          {plazasLibres.map((_, indice) => (
            <div key={indice} className="flex h-[4.25rem] items-center justify-center border-4 border-dashed border-[#5f574f]">
              <span className="animate-parpadeo text-[8px] text-[#c2c3c7]">Waiting...</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          {soyAnfitrion ? (
            <button
              onClick={() => onAccion(() => empezarSala(sala.codigo))}
              disabled={sala.miembros.length < MINIMO_PARA_EMPEZAR}
              className={`${BOTON_PIXEL} bg-[#00e436]`}
            >
              Start mission
            </button>
          ) : (
            <p className="self-center text-[8px] leading-5 text-[#c2c3c7] sm:text-xs">
              Waiting for {anfitrion?.nombreUsuario} to start...
            </p>
          )}
          <button onClick={onSalir} className={`${BOTON_PIXEL} flex items-center gap-2 bg-[#c2c3c7]`}>
            <LogOut className="h-4 w-4" /> Leave
          </button>
        </div>
        {soyAnfitrion && sala.miembros.length < MINIMO_PARA_EMPEZAR && (
          <p className="text-[8px] leading-5 text-[#c2c3c7]">You need at least {MINIMO_PARA_EMPEZAR} players.</p>
        )}
        </section>
      </div>

      <aside className="flex min-h-0 flex-col gap-4">
        <section className={`${CAJA_PIXEL} shrink-0 space-y-3 p-4`}>
          <h2 className="text-[8px] text-[#ffec27] sm:text-xs">Team code</h2>
          <p className="text-2xl tracking-[0.2em]">{sala.codigo}</p>
          <button onClick={copiarCodigo} className={`${BOTON_PIXEL} flex items-center gap-2 bg-[#ffec27]`}>
            <Copy className="h-4 w-4" /> {copiado ? 'Copied!' : 'Copy'}
          </button>
          <p className="font-sans text-xs text-slate-300">Anyone with this code can join from the Friends page.</p>
        </section>
        <InvitarAmigos sala={sala} onAccion={onAccion} />
      </aside>
    </div>
  )
}

function InvitarAmigos({ sala, onAccion }) {
  const [amigos, setAmigos] = useState(null)

  useEffect(() => {
    obtenerAmigos().then((respuesta) => setAmigos(respuesta.amigos), () => setAmigos([]))
  }, [])

  const enLaSala = new Set(sala.miembros.map((miembro) => miembro.jugadorId))
  const candidatos = amigos?.filter(({ jugador }) => !enLaSala.has(jugador.id)) ?? []

  return (
    <section className={`${CAJA_PIXEL} min-h-0 flex-1 space-y-3 overflow-y-auto p-4`}>
      <h2 className="text-[8px] text-[#ffec27] sm:text-xs">Invite friends</h2>
      {amigos && candidatos.length === 0 && (
        <p className="font-sans text-xs text-slate-300">No friends to invite. Add some on the Friends page.</p>
      )}
      {candidatos.map(({ jugador }) => {
        const invitado = sala.invitados.includes(jugador.id)
        return (
          <div key={jugador.id} className="flex items-center justify-between gap-2">
            <span className="truncate text-[8px] sm:text-xs">{jugador.nombreUsuario}</span>
            <button
              disabled={invitado}
              onClick={() => onAccion(() => invitarASala(sala.codigo, jugador.id))}
              className="flex shrink-0 items-center gap-1 border-4 border-black bg-[#29adff] px-2 py-1 text-[8px] text-black disabled:bg-[#5f574f] disabled:text-[#c2c3c7]"
            >
              <UserPlus className="h-3 w-3" /> {invitado ? 'Invited' : 'Invite'}
            </button>
          </div>
        )
      })}
    </section>
  )
}

// Antes de la primera fase se enseña el reparto; después, la fase que se esté jugando.
function Partida({ sala, jugador, catalogo, onAccion }) {
  const ahora = useAhoraDelServidor(sala.desfase)
  const enReparto = Object.keys(sala.resultados).length === 0 && ahora < sala.fase.empiezaEn

  if (enReparto) {
    const segundos = Math.max(0, Math.ceil((sala.fase.empiezaEn - ahora) / 1000))
    return <Reparto sala={sala} jugador={jugador} segundos={segundos} />
  }
  return <FaseEnCurso sala={sala} jugador={jugador} catalogo={catalogo} ahora={ahora} onAccion={onAccion} />
}

// El reparto en un solo panel: mis departamentos con su explicación y el orden de todo el equipo.
function Reparto({ sala, jugador, segundos }) {
  const responsable = (departamentoId) => responsableDe(sala, departamentoId)
  const mios = DEPARTAMENTOS.filter((departamento) => responsable(departamento.id)?.jugadorId === jugador.id)

  return (
    <section className={`${CAJA_PIXEL} flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xs sm:text-base">{mios.length > 1 ? 'Your departments' : 'Your department'}</h2>
        <p className="text-[8px] text-[#ffec27] sm:text-base">Finance starts in {segundos}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {mios.map((departamento) => (
          <TarjetaDepartamento key={departamento.id} departamento={departamento} />
        ))}
      </div>
      <div className="space-y-2">
        <h2 className="text-[8px] leading-4 text-[#c2c3c7]">Mission plan · everybody watches the one at work</h2>
        <ol className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {DEPARTAMENTOS.map((departamento, indice) => (
            <li key={departamento.id} className="flex items-center gap-2 border-4 border-black bg-[#0b1430] p-2">
              <span className="text-[8px] text-[#c2c3c7]">{indice + 1}</span>
              <departamento.Icono className="h-5 w-5 shrink-0" style={{ color: departamento.color }} />
              <div className="min-w-0">
                <p className="truncate text-[8px]">{departamento.nombre}</p>
                <p className="truncate font-sans text-xs text-slate-400">{responsable(departamento.id)?.nombreUsuario ?? 'Nobody'}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function TarjetaDepartamento({ departamento }) {
  return (
    <div className="flex gap-3 border-4 border-black bg-[#0b1430] p-3">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center border-4 border-black" style={{ background: departamento.color }}>
        <departamento.Icono className="h-6 w-6 text-black" />
      </span>
      <div className="space-y-2">
        <p className="text-xs sm:text-base" style={{ color: departamento.color }}>
          {departamento.nombre}
        </p>
        <p className="font-sans text-sm text-slate-200">{departamento.descripcion}</p>
      </div>
    </div>
  )
}
