import { formatoDinero, formatoNumero } from '../formato.js'

const UMBRAL_AVISO = 0.9

function estadoMaximo(valor, limite) {
  if (valor > limite) return 'error'
  return valor > limite * UMBRAL_AVISO ? 'aviso' : 'ok'
}

const estadoMinimo = (valor, minimo) => (valor >= minimo ? 'ok' : 'error')

const ORDEN_ESTADOS = ['ok', 'aviso', 'error']
const peorEstado = (...estados) => ORDEN_ESTADOS[Math.max(...estados.map((estado) => ORDEN_ESTADOS.indexOf(estado)))]

// En los vuelos suborbitales no hay satélite: solo cuentan el presupuesto y el tiempo.
const RECURSOS_SUBORBITALES = ['PRESUPUESTO', 'TIEMPO']

export function calcularRecursos({ resuelto, satelite, mision, dinero, costeCompra, meses, suborbital }) {
  const { requisitos } = mision
  const capacidadCofia = resuelto.cofia?.capacidadKg ?? 0

  const recursos = [
    {
      id: 'MASA',
      nombre: 'Mass',
      // Sin cofia no hay límite con el que comparar: la barra queda vacía en vez de llena.
      valor: resuelto.cofia ? satelite.masaKg : 0,
      maximo: capacidadCofia || 1,
      texto: resuelto.cofia
        ? `${formatoNumero(satelite.masaKg)} / ${formatoNumero(capacidadCofia)} kg`
        : `${formatoNumero(satelite.masaKg)} kg · no fairing`,
      estado: resuelto.cofia ? estadoMaximo(satelite.masaKg, capacidadCofia) : 'aviso',
      explicacion: 'How much the satellite weighs. It has to fit in the fairing, and every extra kilo takes Δv away from the rocket.',
    },
    {
      id: 'POTENCIA',
      nombre: 'Power',
      valor: satelite.potenciaConsumidaW,
      maximo: satelite.potenciaGeneradaW,
      texto: `uses ${formatoNumero(satelite.potenciaConsumidaW)} / makes ${formatoNumero(satelite.potenciaGeneradaW)} W · battery ${formatoNumero(satelite.bateriaWh)} / ${formatoNumero(satelite.bateriaNecesariaWh)} Wh`,
      estado: peorEstado(
        estadoMaximo(satelite.potenciaConsumidaW, satelite.potenciaGeneradaW),
        satelite.bateriaWh >= satelite.bateriaNecesariaWh ? 'ok' : 'aviso',
      ),
      explicacion: `Solar panels are the power plant. In the Earth’s shadow (${formatoNumero(resuelto.orbita?.eclipseHoras * 60)} min per orbit) only the battery is left: you need ${formatoNumero(satelite.bateriaNecesariaWh)} Wh and you have ${formatoNumero(satelite.bateriaWh)} Wh.`,
    },
    {
      id: 'PRESUPUESTO',
      nombre: 'Budget',
      valor: costeCompra,
      maximo: dinero,
      texto: `${formatoDinero(costeCompra)} to buy / ${formatoDinero(dinero)}`,
      estado: estadoMaximo(costeCompra, dinero),
      explicacion:
        mision.objetivo === 'EQUIPO'
          ? 'The Government pays for the parts with the budget Finance raised. The satellite is paid first; the rocket gets whatever is left.'
          : 'Parts in your Warehouse are already paid for. The ones you are missing are bought at launch; if you are short of money, the Government lends you the difference and deducts it from your next payments.',
    },
    {
      id: 'DATOS',
      nombre: 'Data',
      valor: satelite.datosDescargadosMB,
      maximo: Math.max(requisitos.datosMinMB, 1),
      texto: `${formatoNumero(satelite.datosDescargadosMB)} / ${formatoNumero(requisitos.datosMinMB)} MB per day`,
      estado: estadoMinimo(satelite.datosDescargadosMB, requisitos.datosMinMB),
      explicacion: 'The information that reaches Earth each day. Every photo or measurement takes up space, just like on your phone.',
    },
    {
      id: 'COMUNICACIONES',
      nombre: 'Communications',
      valor: satelite.datosGeneradosMB,
      maximo: satelite.descargaMB,
      texto: satelite.tieneAntena
        ? `makes ${formatoNumero(satelite.datosGeneradosMB)} / downloads ${formatoNumero(satelite.descargaMB)} MB per day`
        : 'no antenna',
      estado: satelite.tieneAntena ? estadoMaximo(satelite.datosGeneradosMB, satelite.descargaMB) : 'error',
      explicacion: `You can only send data while the satellite passes over a ground antenna: ${resuelto.orbita?.minutosContactoDia} minutes per day in this orbit. Whatever is not downloaded is lost.`,
    },
    {
      id: 'TIEMPO',
      nombre: 'Time',
      valor: meses,
      maximo: requisitos.plazoMeses,
      texto: suborbital
        ? `${meses} / ${requisitos.plazoMeses} months`
        : `${meses} / ${requisitos.plazoMeses} months · life ${formatoNumero(satelite.vidaUtilDias)} / ${requisitos.vidaUtilMinDias} days`,
      estado: peorEstado(
        estadoMaximo(meses, requisitos.plazoMeses),
        estadoMinimo(satelite.vidaUtilDias, requisitos.vidaUtilMinDias),
      ),
      explicacion: 'Development: advanced parts take longer to build. Lifetime: the structure ages, and in low orbit the thin air slows the satellite down until it falls.',
    },
  ]
  return suborbital ? recursos.filter((recurso) => RECURSOS_SUBORBITALES.includes(recurso.id)) : recursos
}
