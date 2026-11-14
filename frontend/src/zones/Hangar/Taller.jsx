import { useState } from 'react'
import { COLOR_ESTADO } from '../../colores.js'
import BarraRecurso from '../../components/BarraRecurso.jsx'
import FichaPieza from '../../components/FichaPieza.jsx'
import TarjetaPieza from '../../components/TarjetaPieza.jsx'
import { EMPUJE_PESO_MINIMO } from '../../engine/cohete.js'
import { instalarEnCohete, MAX_ETAPAS, quitarDelCohete } from '../../engine/diseno.js'
import { formatoNumero } from '../../formato.js'
import { estaBloqueada } from '../../piezas.js'
import BahiaCohete from './BahiaCohete.jsx'

const SECCIONES = [
  { tipo: 'motor', titulo: 'Engines', ayuda: 'An engine goes into the lowest stage that has none; if every stage has one, it starts a new stage on top.' },
  { tipo: 'tanque', titulo: 'Tanks', ayuda: 'A tank sits on top of the lowest stage that has none; if every stage has one, it starts a new stage on top.' },
  { tipo: 'cofia', titulo: 'Fairing', ayuda: 'The nose that protects the satellite. It goes on top.' },
]

const PIEZA_DE_CAMPO = { motorId: 'motor', tanqueId: 'tanque' }

export default function Taller({ catalogo, analisis, diseno, onCambio, ficha, nivel, empresa }) {
  const [aviso, setAviso] = useState(null)
  const { cohete } = diseno
  const { resuelto } = analisis
  const deltaVRequerido = resuelto.orbita.deltaVRequerido

  const conCohete = (nuevoCohete) => ({ ...diseno, cohete: nuevoCohete })

  function instalar(pieza) {
    const nuevoCohete = instalarEnCohete(cohete, pieza)
    if (!nuevoCohete) {
      setAviso(`A rocket can have up to ${MAX_ETAPAS} stages. Remove a part in the assembly bay first.`)
      return
    }
    setAviso(null)
    onCambio(conCohete(nuevoCohete), pieza, 'instalada')
  }

  function quitar(indiceEtapa, campo) {
    setAviso(null)
    const pieza = campo === 'cofiaId' ? resuelto.cofia : resuelto.etapas[indiceEtapa][PIEZA_DE_CAMPO[campo]]
    onCambio(conCohete(quitarDelCohete(cohete, indiceEtapa, campo)), pieza, 'quitada')
  }

  return (
    <section className="grid gap-6 md:grid-cols-[minmax(0,17rem)_1fr]">
      <div className="space-y-3 md:sticky md:top-16 md:max-h-[calc(100vh-5rem)] md:self-start md:overflow-y-auto">
        <BahiaCohete
          etapas={resuelto.etapas}
          cofia={resuelto.cofia}
          conSatelite={Boolean(resuelto.estructura)}
          empresa={empresa}
          onQuitar={quitar}
          onVaciar={() => onCambio(conCohete({ cofiaId: null, etapas: [] }))}
        />
        {ficha ? (
          <FichaPieza key={`${ficha.pieza.id}-${ficha.accion}-${analisis.piezas.length}`} {...ficha} nivel={nivel} />
        ) : (
          <p className="cristal p-4 text-sm text-slate-400">Click a part to install it. Its details and its effect on your mission will appear here.</p>
        )}
      </div>

      <div className="min-w-0 space-y-5">
        <div className="cristal space-y-3 p-4">
          <BarraRecurso
            etiqueta="Δv (how much speed the rocket can gain)"
            valor={analisis.deltaV}
            maximo={deltaVRequerido}
            texto={`${formatoNumero(Math.round(analisis.deltaV))} / ${formatoNumero(deltaVRequerido)} m/s`}
            color={COLOR_ESTADO[analisis.deltaV >= deltaVRequerido ? 'ok' : 'error']}
          />
          <BarraRecurso
            etiqueta="Thrust-to-weight at liftoff"
            valor={analisis.empujePeso}
            maximo={EMPUJE_PESO_MINIMO}
            texto={`${formatoNumero(analisis.empujePeso)} (minimum ${EMPUJE_PESO_MINIMO})`}
            color={COLOR_ESTADO[analisis.empujePeso >= EMPUJE_PESO_MINIMO ? 'ok' : 'error']}
          />
          <p className="text-xs text-slate-400">
            To stay in orbit you need to travel at about 28,000 km/h. Δv measures how much speed your rocket can gain:
            more propellant helps, but it also adds weight. That is why rockets use stages that drop off when empty.
          </p>
        </div>

        {aviso && <p className="rounded-lg bg-amber-950/70 p-3 text-sm text-amber-200">{aviso}</p>}

        {SECCIONES.map((seccion) => (
          <div key={seccion.tipo} className="space-y-2">
            <h2 className="font-display font-semibold">{seccion.titulo}</h2>
            <p className="text-sm text-slate-400">{seccion.ayuda}</p>
            <div className="grid gap-2 xl:grid-cols-2">
              {catalogo.piezas
                .filter((pieza) => pieza.tipo === seccion.tipo)
                .map((pieza) => (
                  <TarjetaPieza
                    key={pieza.id}
                    pieza={pieza}
                    nivel={nivel}
                    seleccionada={pieza.id === cohete.cofiaId}
                    onElegir={instalar}
                    deshabilitada={estaBloqueada(pieza, nivel)}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
