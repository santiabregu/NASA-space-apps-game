import { costeTotal, instalarEnCohete, piezasDelDiseno, resolverDiseno } from './diseno.js'

// Misiones de equipo. Las fórmulas son las mismas que EvaluadorFases.java: el navegador las usa para enseñar
// el resultado al momento, pero el que cuenta es el que devuelve el servidor.

export const TIPOS_SATELITE = ['estructura', 'panel', 'bateria', 'ordenador', 'antena', 'actitud', 'instrumento', 'escudo']
export const TIPOS_COHETE = ['motor', 'tanque', 'cofia']

export function presupuestoFinanzas({ monedas = 0, grants = 0, aciertos = 0 }, estrella, reglas) {
  const recaudado = estrella.mision.presupuestoBase + monedas * reglas.valorMoneda + grants * reglas.valorGrant
  return Math.round(recaudado * (1 + reglas.bonusPorAcierto * aciertos))
}

export function fiabilidadSoftware({ conexiones = 0, chispas = 0, aciertos = 0 }, reglas) {
  const cables = Math.max(
    0,
    Math.floor((reglas.puntosCables * conexiones) / reglas.conexionesCables) - chispas * reglas.penalizacionChispa,
  )
  return Math.min(100, Math.max(reglas.fiabilidadMinima, cables + aciertos * reglas.puntosPorAcierto))
}

export const contarAciertos = (respuestas, catalogo) =>
  respuestas.filter(({ id, opcion }) => catalogo.preguntas.find((pregunta) => pregunta.id === id)?.correcta === opcion).length

export function elegirPreguntas(catalogo, departamento) {
  const banco = catalogo.preguntas.filter((pregunta) => pregunta.departamento === departamento)
  return [...banco].sort(() => Math.random() - 0.5).slice(0, catalogo.equipo.preguntasPorFase)
}

// La misión con la forma que espera el motor del Hangar (analizarDiseno, objetivosMision...).
export function misionDeEquipo(estrella, catalogo) {
  const { mision } = estrella
  return {
    id: `equipo-${estrella.id}`,
    titulo: `Mission to ${estrella.nombre}`,
    descripcion: estrella.reto,
    objetivo: 'EQUIPO',
    orbitasPermitidas: [mision.orbitaId],
    requisitos: mision.requisitos,
    recursosCriticos: mision.recursosCriticos,
    piezasRecomendadas: mision.piezasObligatorias,
    obligatorias: mision.piezasObligatorias.map((id) => catalogo.piezasPorId[id]),
  }
}

// En equipo las piezas las paga el Gobierno: todas disponibles y ninguna en el almacén.
export function jugadorDeEquipo(catalogo, empresa) {
  return {
    inventario: {},
    empresa,
    campana: { destinosAlcanzados: Object.fromEntries(catalogo.destinos.map((destino) => [destino.id, true])) },
  }
}

export const presupuestoDelEquipo = (resultados) => resultados.FINANCIACION?.datos?.presupuesto ?? 0

export const costeDelDiseno = (diseno, catalogo) => costeTotal(piezasDelDiseno(resolverDiseno(diseno, catalogo)))

// El diseño que ha montado el equipo: el satélite de la fase 3 y el cohete de la fase 4.
// Si una fase de construcción caducó, se añaden las piezas más votadas que quepan y se puedan pagar.
export function disenoDelEquipo(resultados, mision, catalogo) {
  let diseno = {
    orbitaId: mision.orbitasPermitidas[0],
    satelite: resultados.SATELITE?.datos?.diseno ?? { estructuraId: null, componentes: [] },
    cohete: resultados.COHETE?.datos?.diseno ?? { cofiaId: null, etapas: [] },
  }
  for (const departamento of ['SATELITE', 'COHETE']) {
    const resultado = resultados[departamento]
    if (resultado?.caducado) diseno = conVotos(diseno, resultado.votos, presupuestoDelEquipo(resultados), catalogo)
  }
  return diseno
}

function conVotos(diseno, votos, presupuesto, catalogo) {
  let actual = diseno
  for (const id of Object.keys(votos ?? {})) {
    const pieza = catalogo.piezasPorId[id]
    const siguiente = pieza && instalarVotada(actual, pieza, catalogo)
    if (siguiente && costeDelDiseno(siguiente, catalogo) <= presupuesto) actual = siguiente
  }
  return actual
}

function instalarVotada(diseno, pieza, catalogo) {
  const { satelite, cohete } = diseno
  if (pieza.tipo === 'estructura') {
    return satelite.estructuraId ? null : { ...diseno, satelite: { ...satelite, estructuraId: pieza.id } }
  }
  if (TIPOS_SATELITE.includes(pieza.tipo)) {
    const huecos = catalogo.piezasPorId[satelite.estructuraId]?.huecos ?? 0
    if (satelite.componentes.length >= huecos) return null
    return { ...diseno, satelite: { ...satelite, componentes: [...satelite.componentes, pieza.id] } }
  }
  if (pieza.tipo === 'cofia' && cohete.cofiaId) return null
  const nuevoCohete = instalarEnCohete(cohete, pieza)
  return nuevoCohete && { ...diseno, cohete: nuevoCohete }
}
