import { formatoDinero, formatoNumero } from '../formato.js'
import { EMPUJE_PESO_MINIMO } from './cohete.js'
import { formatoAltitud } from './objetivos.js'

const redondo = (valor) => formatoNumero(Math.round(valor))
const aspecto = (nombre, ok, siBien, siMal) => ({ ok, aspecto: nombre, texto: ok ? siBien : siMal })

// La simulación se detiene en el primer fallo; esta valoración repasa todo el diseño para explicar qué salió bien y qué mal.
export function valorarDiseno(analisis, mision, dinero) {
  const { empujePeso, costeCompra, meses } = analisis
  const { requisitos } = mision
  const despegue = aspecto(
    'Liftoff',
    empujePeso >= EMPUJE_PESO_MINIMO,
    `Thrust-to-weight ${formatoNumero(empujePeso)}: the first stage left the pad quickly, wasting little propellant against gravity.`,
    empujePeso < 1
      ? `Thrust-to-weight ${formatoNumero(empujePeso)}: the first-stage engine pushes less than the rocket weighs, so it cannot leave the pad. Put the most powerful engine in stage 1.`
      : `Thrust-to-weight ${formatoNumero(empujePeso)}: a slow liftoff burns extra propellant fighting gravity. Aim for at least ${EMPUJE_PESO_MINIMO}.`,
  )
  const plazo = aspecto(
    'Deadline',
    meses <= requisitos.plazoMeses,
    `Built in ${meses} months, within the ${requisitos.plazoMeses}-month deadline.`,
    `It took ${meses} months to build and the deadline was ${requisitos.plazoMeses}: advanced parts take longer.`,
  )
  const presupuesto = aspecto(
    'Budget',
    costeCompra <= dinero,
    costeCompra === 0
      ? 'Every part came from your Warehouse: nothing to buy.'
      : `The missing parts cost ${formatoDinero(costeCompra)} and your company had ${formatoDinero(dinero)}.`,
    `The missing parts cost ${formatoDinero(costeCompra)} but your company had ${formatoDinero(dinero)}, so it needed a rescue loan.`,
  )

  if (analisis.suborbital) {
    const { apogeoKm } = analisis
    return [
      aspecto(
        'Reach altitude',
        apogeoKm >= requisitos.altitudMinKm,
        `The rocket climbed ${formatoAltitud(apogeoKm)} km and the goal was ${formatoNumero(requisitos.altitudMinKm)} km.`,
        `The rocket climbed ${formatoAltitud(apogeoKm)} km and the goal was ${formatoNumero(requisitos.altitudMinKm)} km. More propellant, a second stage or a lighter rocket would climb higher.`,
      ),
      despegue,
      plazo,
      presupuesto,
    ]
  }
  return valorarPuestaEnOrbita(analisis, mision, [despegue, plazo, presupuesto])
}

function valorarPuestaEnOrbita(analisis, mision, [despegue, plazo, presupuesto]) {
  const { resuelto, satelite, deltaV } = analisis
  const { orbita, cofia } = resuelto
  const { requisitos } = mision
  const margenDeltaV = deltaV - orbita.deltaVRequerido
  const minutosEclipse = formatoNumero(orbita.eclipseHoras * 60)
  const sistemasQueFaltan = [
    !satelite.tieneOrdenador && 'an onboard computer',
    !satelite.tieneAntena && 'an antenna',
    satelite.potenciaGeneradaW === 0 && 'solar panels',
  ].filter(Boolean)

  return [
    aspecto(
      'Reach orbit',
      margenDeltaV >= 0,
      `The rocket had ${redondo(deltaV)} m/s of Δv and the ${orbita.nombre} needs ${redondo(orbita.deltaVRequerido)}: ${redondo(margenDeltaV)} m/s to spare.`,
      `The rocket had ${redondo(deltaV)} m/s of Δv and the ${orbita.nombre} needs ${redondo(orbita.deltaVRequerido)}: ${redondo(-margenDeltaV)} m/s short. Another stage, higher-Isp engines or a lighter payload would close the gap.`,
    ),
    despegue,
    aspecto(
      'Fits in the fairing',
      satelite.masaKg <= cofia.capacidadKg,
      `The ${formatoNumero(satelite.masaKg)} kg satellite fit in the ${cofia.nombre} (up to ${formatoNumero(cofia.capacidadKg)} kg).`,
      `The ${formatoNumero(satelite.masaKg)} kg satellite is too heavy for the ${cofia.nombre} (up to ${formatoNumero(cofia.capacidadKg)} kg).`,
    ),
    aspecto(
      'Essential systems',
      sistemasQueFaltan.length === 0,
      'Computer, antenna and solar panels on board: the satellite could switch on, recharge and talk to Earth.',
      `Missing ${sistemasQueFaltan.join(', ')}. Without them the satellite cannot work.`,
    ),
    aspecto(
      'Power',
      satelite.potenciaGeneradaW >= satelite.potenciaConsumidaW,
      `The panels make ${formatoNumero(satelite.potenciaGeneradaW)} W and the equipment uses ${formatoNumero(satelite.potenciaConsumidaW)} W.`,
      `The panels make ${formatoNumero(satelite.potenciaGeneradaW)} W but the equipment uses ${formatoNumero(satelite.potenciaConsumidaW)} W, so some instruments have to switch off.`,
    ),
    aspecto(
      'Battery in eclipse',
      satelite.bateriaWh >= satelite.bateriaNecesariaWh,
      `The ${formatoNumero(satelite.bateriaWh)} Wh battery covers the ${minutosEclipse} min in the Earth’s shadow (it needs ${formatoNumero(satelite.bateriaNecesariaWh)} Wh).`,
      `In the Earth’s shadow (${minutosEclipse} min per orbit) the battery has ${formatoNumero(satelite.bateriaWh)} Wh and needs ${formatoNumero(satelite.bateriaNecesariaWh)} Wh: everything switches off in every eclipse.`,
    ),
    satelite.datosGeneradosMB > 0 &&
      aspecto(
        'Downlink',
        satelite.descargaMB >= satelite.datosGeneradosMB,
        `The antenna can download ${formatoNumero(satelite.descargaMB)} MB per day, more than the ${formatoNumero(satelite.datosGeneradosMB)} MB the instruments make.`,
        `The instruments make ${formatoNumero(satelite.datosGeneradosMB)} MB per day but the antenna only downloads ${formatoNumero(satelite.descargaMB)} MB in ${orbita.minutosContactoDia} minutes of contact: the rest is lost.`,
      ),
    requisitos.valorCientificoMin > 0 &&
      aspecto(
        'Science value',
        satelite.valorCientifico >= requisitos.valorCientificoMin,
        `Science value ${satelite.valorCientifico} of the ${requisitos.valorCientificoMin} required.`,
        `Science value ${satelite.valorCientifico} of the ${requisitos.valorCientificoMin} required. Instruments lose value without enough power, without a battery for the eclipse, without reaction wheels to point, or when their data cannot be downloaded.`,
      ),
    requisitos.datosMinMB > 0 &&
      aspecto(
        'Data to Earth',
        satelite.datosDescargadosMB >= requisitos.datosMinMB,
        `${formatoNumero(satelite.datosDescargadosMB)} MB per day reached the ground; the client needed ${formatoNumero(requisitos.datosMinMB)} MB.`,
        `Only ${formatoNumero(satelite.datosDescargadosMB)} MB per day reached the ground and the client needed ${formatoNumero(requisitos.datosMinMB)} MB.`,
      ),
    requisitos.vidaUtilMinDias > 0 &&
      aspecto(
        'Lifetime',
        satelite.vidaUtilDias >= requisitos.vidaUtilMinDias,
        `The satellite lasts ${formatoNumero(satelite.vidaUtilDias)} days and the mission needs ${formatoNumero(requisitos.vidaUtilMinDias)}.`,
        `The satellite lasts ${formatoNumero(satelite.vidaUtilDias)} days (structure ${formatoNumero(resuelto.estructura.vidaUtilDias)}, before air drag brings it down ${formatoNumero(orbita.vidaOrbitalDias)}) and the mission needs ${formatoNumero(requisitos.vidaUtilMinDias)}.`,
      ),
    plazo,
    presupuesto,
  ].filter(Boolean)
}
