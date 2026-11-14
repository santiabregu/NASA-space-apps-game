import { formatoDinero, formatoNumero } from '../formato.js'

const UMBRAL_AVISO = 0.9

function estadoMaximo(valor, limite) {
  if (valor > limite) return 'error'
  return valor > limite * UMBRAL_AVISO ? 'aviso' : 'ok'
}

const estadoMinimo = (valor, minimo) => (valor >= minimo ? 'ok' : 'error')

const ORDEN_ESTADOS = ['ok', 'aviso', 'error']
const peorEstado = (...estados) => ORDEN_ESTADOS[Math.max(...estados.map((estado) => ORDEN_ESTADOS.indexOf(estado)))]

export function calcularRecursos({ resuelto, satelite, mision, dinero, coste, meses }) {
  const { requisitos } = mision
  const capacidadCofia = resuelto.cofia?.capacidadKg ?? 0

  return [
    {
      id: 'MASA',
      nombre: 'Masa',
      valor: satelite.masaKg,
      maximo: capacidadCofia,
      texto: resuelto.cofia
        ? `${formatoNumero(satelite.masaKg)} / ${formatoNumero(capacidadCofia)} kg`
        : `${formatoNumero(satelite.masaKg)} kg · sin cofia`,
      estado: resuelto.cofia ? estadoMaximo(satelite.masaKg, capacidadCofia) : 'aviso',
      explicacion: 'Lo que pesa el satélite. Tiene que caber en la cofia y cada kilo extra le quita Δv al cohete.',
    },
    {
      id: 'POTENCIA',
      nombre: 'Potencia',
      valor: satelite.potenciaConsumidaW,
      maximo: satelite.potenciaGeneradaW,
      texto: `consume ${formatoNumero(satelite.potenciaConsumidaW)} / genera ${formatoNumero(satelite.potenciaGeneradaW)} W`,
      estado: peorEstado(
        estadoMaximo(satelite.potenciaConsumidaW, satelite.potenciaGeneradaW),
        satelite.bateriaWh >= satelite.bateriaNecesariaWh ? 'ok' : 'aviso',
      ),
      explicacion: `Los paneles son la central eléctrica. En la sombra de la Tierra (${formatoNumero(resuelto.orbita.eclipseHoras * 60)} min por vuelta) solo queda la batería: necesitas ${formatoNumero(satelite.bateriaNecesariaWh)} Wh y tienes ${formatoNumero(satelite.bateriaWh)} Wh.`,
    },
    {
      id: 'PRESUPUESTO',
      nombre: 'Presupuesto',
      valor: coste,
      maximo: dinero,
      texto: `${formatoDinero(coste)} / ${formatoDinero(dinero)}`,
      estado: estadoMaximo(coste, dinero),
      explicacion: 'Las piezas las paga tu empresa al lanzar. El Gobierno solo paga si la misión sale bien; si no te llega el dinero, te presta la diferencia y la descuenta de tus próximos pagos.',
    },
    {
      id: 'DATOS',
      nombre: 'Datos',
      valor: satelite.datosDescargadosMB,
      maximo: Math.max(requisitos.datosMinMB, 1),
      texto: `${formatoNumero(satelite.datosDescargadosMB)} / ${formatoNumero(requisitos.datosMinMB)} MB al día`,
      estado: estadoMinimo(satelite.datosDescargadosMB, requisitos.datosMinMB),
      explicacion: 'La información que llega a la Tierra cada día. Cada foto o medición ocupa espacio, como en tu móvil.',
    },
    {
      id: 'COMUNICACIONES',
      nombre: 'Comunicaciones',
      valor: satelite.datosGeneradosMB,
      maximo: satelite.descargaMB,
      texto: satelite.tieneAntena
        ? `genera ${formatoNumero(satelite.datosGeneradosMB)} / descarga ${formatoNumero(satelite.descargaMB)} MB al día`
        : 'sin antena',
      estado: satelite.tieneAntena ? estadoMaximo(satelite.datosGeneradosMB, satelite.descargaMB) : 'error',
      explicacion: `Solo puedes enviar datos cuando el satélite pasa sobre una antena de tierra: ${resuelto.orbita.minutosContactoDia} minutos al día en esta órbita. Lo que no se descarga, se pierde.`,
    },
    {
      id: 'TIEMPO',
      nombre: 'Tiempo',
      valor: meses,
      maximo: requisitos.plazoMeses,
      texto: `${meses} / ${requisitos.plazoMeses} meses · vida ${formatoNumero(satelite.vidaUtilDias)} / ${requisitos.vidaUtilMinDias} días`,
      estado: peorEstado(
        estadoMaximo(meses, requisitos.plazoMeses),
        estadoMinimo(satelite.vidaUtilDias, requisitos.vidaUtilMinDias),
      ),
      explicacion: 'Desarrollo: las piezas avanzadas tardan más en construirse. Vida útil: la estructura envejece y en órbita baja el aire frena el satélite hasta que cae.',
    },
  ]
}
