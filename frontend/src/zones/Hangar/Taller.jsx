import { TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import FichaPieza from '../../components/FichaPieza.jsx'
import TarjetaPieza from '../../components/TarjetaPieza.jsx'
import { instalarEnCohete, MAX_ETAPAS, quitarDelCohete } from '../../engine/diseno.js'
import { disponibilidad } from '../../piezas.js'
import BahiaCohete from './BahiaCohete.jsx'

const SECCIONES = [
  { tipo: 'motor', titulo: 'Engines', ayuda: 'An engine goes into the lowest stage that has none; if every stage has one, it starts a new stage on top.' },
  { tipo: 'tanque', titulo: 'Tanks', ayuda: 'A tank sits on top of the lowest stage that has none; if every stage has one, it starts a new stage on top.' },
  { tipo: 'cofia', titulo: 'Nose and fairing', ayuda: 'The nose cuts through the air and protects whatever you carry. It goes on top.' },
]

const PIEZA_DE_CAMPO = { motorId: 'motor', tanqueId: 'tanque' }

export default function Taller({ catalogo, analisis, diseno, onCambio, ficha, jugador, recomendadas, empresa, onPrevisualizar, onFinPrevisualizar, votos = {} }) {
  const [aviso, setAviso] = useState(null)
  const { cohete } = diseno
  const { resuelto } = analisis
  const idsInstalados = [cohete.cofiaId, ...cohete.etapas.flatMap((etapa) => [etapa.motorId, etapa.tanqueId])]

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

  function previsualizar(pieza) {
    const nuevoCohete = instalarEnCohete(cohete, pieza)
    if (nuevoCohete) onPrevisualizar(conCohete(nuevoCohete), pieza)
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
          <FichaPieza key={`${ficha.pieza.id}-${ficha.accion}-${analisis.piezas.length}`} {...ficha} disponibilidad={disponibilidad(ficha.pieza, jugador, catalogo)} />
        ) : (
          <p className="cristal p-4 text-sm text-slate-400">Click a part to install it. Its details and its effect on your mission will appear here.</p>
        )}
      </div>

      <div className="min-w-0 space-y-5">
        <div className="flex gap-3 rounded-xl border border-amber-300/40 bg-amber-950/60 p-4 text-sm text-amber-100 backdrop-blur-md">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
          <div className="space-y-1">
            <p className="font-display font-semibold text-amber-300">Order matters!</p>
            <p>
              Parts stack from the ground up. The first engine and tank you click become stage 1, the bottom stage that
              has to lift the whole rocket: start with your most powerful engine. To change the order, click a part in the
              assembly bay to remove it.
            </p>
          </div>
        </div>

        {aviso && <p className="rounded-lg bg-amber-950/70 p-3 text-sm text-amber-200">{aviso}</p>}

        {SECCIONES.map((seccion) => (
          <div key={seccion.tipo} className="space-y-2">
            <h2 className="font-display font-semibold">{seccion.titulo}</h2>
            <p className="text-sm text-slate-400">{seccion.ayuda}</p>
            <div className="grid gap-2 2xl:grid-cols-2">
              {catalogo.piezas
                .filter((pieza) => pieza.tipo === seccion.tipo)
                .map((pieza) => {
                  const disponible = disponibilidad(pieza, jugador, catalogo)
                  return (
                    <TarjetaPieza
                      key={pieza.id}
                      pieza={pieza}
                      recomendada={recomendadas.includes(pieza.id)}
                      votos={votos[pieza.id]}
                      disponibilidad={disponible}
                      instaladas={idsInstalados.filter((id) => id === pieza.id).length}
                      onElegir={instalar}
                      onPrevisualizar={previsualizar}
                      onFinPrevisualizar={onFinPrevisualizar}
                      deshabilitada={Boolean(disponible.bloqueadaHasta)}
                    />
                  )
                })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
