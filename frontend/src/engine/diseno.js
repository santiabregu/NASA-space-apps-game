export const MAX_ETAPAS = 3

export function disenoInicial(mision) {
  return {
    orbitaId: mision.orbitasPermitidas[0] ?? null,
    satelite: { estructuraId: null, componentes: [] },
    cohete: { cofiaId: null, etapas: [] },
  }
}

export function instalarEnCohete(cohete, pieza) {
  if (pieza.tipo === 'cofia') return { ...cohete, cofiaId: pieza.id }
  const campo = pieza.tipo === 'motor' ? 'motorId' : 'tanqueId'
  const libre = cohete.etapas.findIndex((etapa) => !etapa[campo])
  if (libre >= 0) {
    return { ...cohete, etapas: cohete.etapas.map((etapa, i) => (i === libre ? { ...etapa, [campo]: pieza.id } : etapa)) }
  }
  if (cohete.etapas.length >= MAX_ETAPAS) return null
  return { ...cohete, etapas: [...cohete.etapas, { motorId: null, tanqueId: null, [campo]: pieza.id }] }
}

export function quitarDelCohete(cohete, indiceEtapa, campo) {
  if (campo === 'cofiaId') return { ...cohete, cofiaId: null }
  const etapas = cohete.etapas
    .map((etapa, i) => (i === indiceEtapa ? { ...etapa, [campo]: null } : etapa))
    .filter((etapa) => etapa.motorId || etapa.tanqueId)
  return { ...cohete, etapas }
}

export function resolverDiseno(diseno, { piezasPorId, orbitasPorId }) {
  const pieza = (id) => piezasPorId[id] ?? null
  return {
    orbita: orbitasPorId[diseno.orbitaId],
    estructura: pieza(diseno.satelite.estructuraId),
    componentes: diseno.satelite.componentes.map(pieza),
    cofia: pieza(diseno.cohete.cofiaId),
    etapas: diseno.cohete.etapas.map((etapa) => ({ motor: pieza(etapa.motorId), tanque: pieza(etapa.tanqueId) })),
  }
}

export function piezasDelDiseno(resuelto) {
  return [
    resuelto.estructura,
    ...resuelto.componentes,
    resuelto.cofia,
    ...resuelto.etapas.flatMap((etapa) => [etapa.motor, etapa.tanque]),
  ].filter(Boolean)
}

const TIPOS_COHETE = ['motor', 'tanque', 'cofia']

// Inversa de piezasDelDiseno: las etapas llegan como motor, tanque, motor, tanque… de abajo arriba.
export function disenoDesdePiezas(piezaIds, orbitaId, { piezasPorId }) {
  const piezas = piezaIds.map((id) => piezasPorId[id]).filter(Boolean)
  const etapas = []
  for (const pieza of piezas.filter((p) => p.tipo === 'motor' || p.tipo === 'tanque')) {
    const campo = pieza.tipo === 'motor' ? 'motorId' : 'tanqueId'
    const ultima = etapas.at(-1)
    if (ultima && !ultima[campo]) ultima[campo] = pieza.id
    else etapas.push({ motorId: null, tanqueId: null, [campo]: pieza.id })
  }
  return {
    orbitaId,
    satelite: {
      estructuraId: piezas.find((p) => p.tipo === 'estructura')?.id ?? null,
      componentes: piezas.filter((p) => p.tipo !== 'estructura' && !TIPOS_COHETE.includes(p.tipo)).map((p) => p.id),
    },
    cohete: { cofiaId: piezas.find((p) => p.tipo === 'cofia')?.id ?? null, etapas },
  }
}

export const costeTotal = (piezas) => piezas.reduce((total, pieza) => total + pieza.coste, 0)

const MESES_INTEGRACION = 1

export function mesesDesarrollo(piezas) {
  if (piezas.length === 0) return 0
  return Math.max(...piezas.map((pieza) => pieza.mesesDesarrollo)) + MESES_INTEGRACION
}

export function faltasDeDiseno(resuelto, suborbital) {
  const faltas = []
  if (!suborbital && !resuelto.estructura) faltas.push('Choose the satellite structure in the Lab')
  if (resuelto.etapas.length === 0) faltas.push('Build at least one rocket stage in the Workshop')
  if (!resuelto.cofia) faltas.push('Choose a nose cone or fairing in the Workshop')
  if (resuelto.etapas.some((etapa) => !etapa.motor || !etapa.tanque)) {
    faltas.push('Every rocket stage needs an engine and a tank')
  }
  return faltas
}

// Las piezas del diseño que el inventario no cubre, contando las repetidas. Se compran al lanzar.
export function piezasQueFaltan(piezas, inventario) {
  const disponibles = { ...inventario }
  return piezas.filter((pieza) => {
    if ((disponibles[pieza.id] ?? 0) > 0) {
      disponibles[pieza.id] -= 1
      return false
    }
    return true
  })
}
