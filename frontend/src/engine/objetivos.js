import { formatoNumero } from '../formato.js'
import { EMPUJE_PESO_MINIMO } from './cohete.js'

const redondo = (valor) => formatoNumero(Math.round(valor))
export const formatoAltitud = (km) => (Number.isFinite(km) ? redondo(km) : 'escapes Earth')
const alMenos = (valor, minimo) => (valor >= minimo ? 'ok' : 'error')
const comoMucho = (valor, maximo) => (valor <= maximo ? 'ok' : 'error')

// Lo que decide si la misión sale bien. Complementa a los 6 recursos del reto, que miden consumo.
export function objetivosMision(analisis, mision) {
  const { resuelto, satelite, deltaV, empujePeso, apogeoKm, meses, suborbital } = analisis
  const { orbita, cofia } = resuelto
  const { requisitos } = mision
  const hayCohete = resuelto.etapas.some((etapa) => etapa.motor && etapa.tanque)

  return [
    suborbital && {
      id: 'altitud',
      nombre: `Reach ${formatoNumero(requisitos.altitudMinKm)} km`,
      valor: apogeoKm,
      objetivo: requisitos.altitudMinKm,
      unidad: 'km',
      mayorEsMejor: true,
      estado: hayCohete ? alMenos(apogeoKm, requisitos.altitudMinKm) : 'pendiente',
      texto: `${formatoAltitud(apogeoKm)} / ${formatoNumero(requisitos.altitudMinKm)} km`,
      explicacion:
        'How high the rocket climbs before falling back into the sea. While the engine burns, gravity takes 9.8 m/s of speed away every second, and the air slows small rockets a lot. Space begins at 100 km, the Kármán line.',
    },
    !suborbital && {
      id: 'orbita',
      nombre: 'Reach orbit',
      valor: deltaV,
      objetivo: orbita.deltaVRequerido,
      unidad: 'm/s',
      mayorEsMejor: true,
      estado: hayCohete ? alMenos(deltaV, orbita.deltaVRequerido) : 'pendiente',
      texto: `${redondo(deltaV)} / ${redondo(orbita.deltaVRequerido)} m/s`,
      explicacion:
        'To stay in orbit you need to travel at about 28,000 km/h. Δv measures how much speed your rocket can gain: more propellant helps, but it also adds weight. That is why rockets use stages that drop off when empty.',
    },
    {
      id: 'despegue',
      nombre: 'Liftoff',
      valor: empujePeso,
      objetivo: EMPUJE_PESO_MINIMO,
      unidad: '',
      mayorEsMejor: true,
      estado: hayCohete ? alMenos(empujePeso, EMPUJE_PESO_MINIMO) : 'pendiente',
      texto: `${formatoNumero(empujePeso)} / ${EMPUJE_PESO_MINIMO} thrust-to-weight`,
      explicacion: `The first-stage engine must push harder than the whole rocket weighs. Below 1 it cannot leave the pad; below ${EMPUJE_PESO_MINIMO} it climbs slowly and wastes propellant fighting gravity.`,
    },
    !suborbital && {
      id: 'cofia',
      nombre: 'Fits in fairing',
      valor: satelite.masaKg,
      objetivo: cofia?.capacidadKg ?? 0,
      unidad: 'kg',
      mayorEsMejor: false,
      estado: cofia ? comoMucho(satelite.masaKg, cofia.capacidadKg) : 'pendiente',
      texto: cofia
        ? `${formatoNumero(satelite.masaKg)} / ${formatoNumero(cofia.capacidadKg)} kg`
        : `${formatoNumero(satelite.masaKg)} kg · choose a fairing`,
      explicacion: 'The fairing is the rocket’s nose: it shields the satellite from the air during ascent, and each one takes a maximum mass.',
    },
    requisitos.valorCientificoMin > 0 && {
      id: 'ciencia',
      nombre: 'Science value',
      valor: satelite.valorCientifico,
      objetivo: requisitos.valorCientificoMin,
      unidad: '',
      mayorEsMejor: true,
      estado: alMenos(satelite.valorCientifico, requisitos.valorCientificoMin),
      texto: `${satelite.valorCientifico} / ${requisitos.valorCientificoMin}`,
      explicacion:
        'How much useful science the instruments deliver. It drops without enough power, without a battery for the eclipse, without reaction wheels to point, or if the data cannot be downloaded.',
    },
    requisitos.datosMinMB > 0 && {
      id: 'datos',
      nombre: 'Data to Earth',
      valor: satelite.datosDescargadosMB,
      objetivo: requisitos.datosMinMB,
      unidad: 'MB',
      mayorEsMejor: true,
      estado: alMenos(satelite.datosDescargadosMB, requisitos.datosMinMB),
      texto: `${formatoNumero(satelite.datosDescargadosMB)} / ${formatoNumero(requisitos.datosMinMB)} MB per day`,
      explicacion: 'The data that actually reaches the ground each day: what the instruments make, limited by the antenna and the contact time of the orbit.',
    },
    requisitos.vidaUtilMinDias > 0 && {
      id: 'vida',
      nombre: 'Lifetime',
      valor: satelite.vidaUtilDias,
      objetivo: requisitos.vidaUtilMinDias,
      unidad: 'days',
      mayorEsMejor: true,
      estado: alMenos(satelite.vidaUtilDias, requisitos.vidaUtilMinDias),
      texto: `${formatoNumero(satelite.vidaUtilDias)} / ${formatoNumero(requisitos.vidaUtilMinDias)} days`,
      explicacion: 'How long the satellite keeps working: the structure ages, and in low orbits the thin air slows it down until it falls.',
    },
    {
      id: 'plazo',
      nombre: 'Deadline',
      valor: meses,
      objetivo: requisitos.plazoMeses,
      unidad: 'months',
      mayorEsMejor: false,
      estado: comoMucho(meses, requisitos.plazoMeses),
      texto: `${meses} / ${requisitos.plazoMeses} months`,
      explicacion: 'Months to build: the slowest part sets the pace, plus one month to put everything together.',
    },
  ].filter(Boolean)
}
