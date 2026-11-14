import { FlaskConical, ListChecks, Rocket, Warehouse } from 'lucide-react'
import { useState } from 'react'
import PanelMision from '../../components/PanelMision.jsx'
import { esSuborbital } from '../../engine/analisis.js'
import Almacen from './Almacen.jsx'
import Laboratorio from './Laboratorio.jsx'
import Plataforma from './Plataforma.jsx'
import Taller from './Taller.jsx'
import { useBancoDeTrabajo } from './useBancoDeTrabajo.js'

const AREAS = [
  { id: 'laboratorio', nombre: 'Lab', Icono: FlaskConical },
  { id: 'taller', nombre: 'Workshop', Icono: Rocket },
  { id: 'plataforma', nombre: 'Launch pad', Icono: ListChecks },
  { id: 'almacen', nombre: 'Warehouse', Icono: Warehouse },
]

export default function Hangar({ jugador, catalogo, mision, diseno, onCambiarDiseno, onLanzado, onIrA }) {
  const [area, setArea] = useState(areaInicial(mision))
  const banco = useBancoDeTrabajo({
    catalogo,
    mision,
    diseno,
    dinero: jugador.dinero,
    inventario: jugador.inventario,
    onCambiarDiseno,
  })
  const { analisis, ficha, previa } = banco

  if (!mision) {
    return (
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <header className="space-y-2">
          <h1 className="font-display text-2xl font-bold">Hangar</h1>
          <p className="text-slate-400">
            This is where you build. Accept a Government mission first, so you know what satellite and rocket you need.
          </p>
          <button onClick={() => onIrA('misiones')} className="rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950">
            See missions
          </button>
        </header>
        <Almacen catalogo={catalogo} jugador={jugador} />
      </main>
    )
  }

  function cambiarArea(nuevaArea) {
    setArea(nuevaArea)
    banco.limpiar()
  }

  const props = {
    catalogo,
    analisis,
    diseno,
    onCambio: banco.aplicarCambio,
    ficha,
    jugador,
    recomendadas: mision.piezasRecomendadas ?? [],
    onPrevisualizar: banco.previsualizar,
    onFinPrevisualizar: banco.finPrevisualizar,
  }

  return (
    <main className="mx-auto max-w-6xl space-y-4 px-4 py-6">
      <header className="space-y-3">
        <div>
          <p className="text-sm text-slate-400">Mission in design</p>
          <h1 className="font-display text-2xl font-bold">{mision.titulo}</h1>
          <p className="mt-1 max-w-3xl text-slate-300">{mision.descripcion}</p>
        </div>
        {!analisis.suborbital && (
          <SelectorOrbita catalogo={catalogo} mision={mision} diseno={diseno} onCambiarDiseno={onCambiarDiseno} />
        )}
        <div className="flex flex-wrap gap-2">
          {areasDe(mision).map((destino) => (
            <button
              key={destino.id}
              onClick={() => cambiarArea(destino.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm ${
                area === destino.id ? 'bg-cyan-400 font-semibold text-slate-950' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <destino.Icono className="h-4 w-4" />
              {destino.nombre}
            </button>
          ))}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0">
          {area === 'laboratorio' && <Laboratorio {...props} />}
          {area === 'taller' && <Taller {...props} empresa={jugador.empresa} />}
          {area === 'plataforma' && (
            <Plataforma
              analisis={analisis}
              mision={mision}
              dinero={jugador.dinero}
              deuda={jugador.empresa.deuda}
              onLanzado={onLanzado}
            />
          )}
          {area === 'almacen' && <Almacen catalogo={catalogo} jugador={jugador} />}
        </div>
        <aside className="lg:sticky lg:top-16 lg:self-start">
          <PanelMision analisis={analisis} previa={previa} mision={mision} />
        </aside>
      </div>
    </main>
  )
}

// Los vuelos suborbitales no llevan satélite: el Laboratorio no pinta nada.
const areasDe = (mision) => (esSuborbital(mision) ? AREAS.filter((area) => area.id !== 'laboratorio') : AREAS)

function areaInicial(mision) {
  if (!mision) return 'almacen'
  return esSuborbital(mision) ? 'taller' : 'laboratorio'
}

function SelectorOrbita({ catalogo, mision, diseno, onCambiarDiseno }) {
  const orbita = catalogo.orbitasPorId[diseno.orbitaId]

  return (
    <div className="cristal space-y-2 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-400">Orbit:</span>
        {mision.orbitasPermitidas.map((id) => (
          <button
            key={id}
            onClick={() => onCambiarDiseno({ ...diseno, orbitaId: id })}
            className={`rounded-lg px-3 py-1 text-sm ${
              id === diseno.orbitaId ? 'bg-slate-700 text-white ring-1 ring-cyan-400' : 'bg-slate-800/80 text-slate-400'
            }`}
          >
            {catalogo.orbitasPorId[id].nombre}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-400">{orbita.explicacion}</p>
    </div>
  )
}
