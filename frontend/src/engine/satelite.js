const MB_POR_MEGABIT = 1 / 8
const FACTOR_SIN_APUNTADO = 0.3
const FACTOR_SIN_BATERIA = 0.7

const suma = (lista, valor) => lista.reduce((total, elemento) => total + valor(elemento), 0)
const deTipo = (componentes, tipo) => componentes.filter((componente) => componente.tipo === tipo)

export function analizarSatelite({ estructura, componentes }, orbita) {
  const instrumentos = deTipo(componentes, 'instrumento')
  const antenas = deTipo(componentes, 'antena')
  const tieneApuntado = deTipo(componentes, 'actitud').length > 0

  const potenciaGeneradaW = suma(componentes.filter((c) => c.potenciaW > 0), (c) => c.potenciaW)
  const potenciaConsumidaW = suma(componentes.filter((c) => c.potenciaW < 0), (c) => -c.potenciaW)
  const bateriaWh = suma(deTipo(componentes, 'bateria'), (c) => c.capacidadWh)
  const bateriaNecesariaWh = potenciaConsumidaW * orbita.eclipseHoras
  const datosGeneradosMB = suma(instrumentos, (i) => i.datosPorDiaMB)
  const descargaMB = suma(antenas, (a) => a.tasaMbps) * orbita.minutosContactoDia * 60 * MB_POR_MEGABIT

  const factorEnergia = potenciaConsumidaW === 0 ? 1 : Math.min(1, potenciaGeneradaW / potenciaConsumidaW)
  const factorBateria = bateriaWh >= bateriaNecesariaWh ? 1 : FACTOR_SIN_BATERIA
  const factorDescarga = datosGeneradosMB === 0 ? 1 : Math.min(1, descargaMB / datosGeneradosMB)
  const valorInstrumentos = suma(
    instrumentos,
    (i) => i.valorCientifico * (i.requiereApuntado && !tieneApuntado ? FACTOR_SIN_APUNTADO : 1),
  )

  return {
    masaKg: (estructura?.masaKg ?? 0) + suma(componentes, (c) => c.masaKg),
    huecos: estructura?.huecos ?? 0,
    huecosUsados: componentes.length,
    potenciaGeneradaW,
    potenciaConsumidaW,
    bateriaWh,
    bateriaNecesariaWh,
    datosGeneradosMB,
    descargaMB,
    datosDescargadosMB: Math.min(datosGeneradosMB, descargaMB) * factorEnergia,
    vidaUtilDias: estructura ? Math.min(estructura.vidaUtilDias, orbita.vidaOrbitalDias) : 0,
    valorCientifico: Math.round(valorInstrumentos * factorEnergia * factorBateria * factorDescarga),
    tieneOrdenador: deTipo(componentes, 'ordenador').length > 0,
    tieneAntena: antenas.length > 0,
    instrumentosSinApuntado: instrumentos.filter((i) => i.requiereApuntado && !tieneApuntado),
  }
}
