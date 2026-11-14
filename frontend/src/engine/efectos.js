import { formatoDinero, formatoNumero } from '../formato.js'

const UMBRAL = 0.005
const conUnidad = (unidad) => (valor) => `${formatoNumero(valor)} ${unidad}`
const sinDecimalesExtra = (valor) => valor.toLocaleString('en-US', { maximumFractionDigits: 2 })

const MEDIDAS = [
  { etiqueta: 'satellite mass', valor: (a) => a.satelite.masaKg, formato: conUnidad('kg'), mayorEsMejor: false },
  { etiqueta: 'power generated', valor: (a) => a.satelite.potenciaGeneradaW, formato: conUnidad('W'), mayorEsMejor: true },
  { etiqueta: 'power used', valor: (a) => a.satelite.potenciaConsumidaW, formato: conUnidad('W'), mayorEsMejor: false },
  { etiqueta: 'battery capacity', valor: (a) => a.satelite.bateriaWh, formato: conUnidad('Wh'), mayorEsMejor: true },
  { etiqueta: 'data produced per day', valor: (a) => a.satelite.datosGeneradosMB, formato: conUnidad('MB'), mayorEsMejor: true },
  { etiqueta: 'data downloaded per day', valor: (a) => a.satelite.datosDescargadosMB, formato: conUnidad('MB'), mayorEsMejor: true },
  { etiqueta: 'download capacity per day', valor: (a) => a.satelite.descargaMB, formato: conUnidad('MB'), mayorEsMejor: true },
  { etiqueta: 'science value', valor: (a) => a.satelite.valorCientifico, formato: formatoNumero, mayorEsMejor: true },
  { etiqueta: 'satellite lifetime', valor: (a) => a.satelite.vidaUtilDias, formato: conUnidad('days'), mayorEsMejor: true },
  { etiqueta: 'Δv', valor: (a) => Math.round(a.deltaV), formato: conUnidad('m/s'), mayorEsMejor: true },
  { etiqueta: 'thrust-to-weight', valor: (a) => a.empujePeso, formato: sinDecimalesExtra, mayorEsMejor: true },
  { etiqueta: 'parts to buy', valor: (a) => a.costeCompra, formato: formatoDinero, mayorEsMejor: false },
  { etiqueta: 'maximum altitude', valor: (a) => (a.suborbital && Number.isFinite(a.apogeoKm) ? Math.round(a.apogeoKm) : 0), formato: conUnidad('km'), mayorEsMejor: true },
  { etiqueta: 'development time', valor: (a) => a.meses, formato: conUnidad('months'), mayorEsMejor: false },
]

export function efectosDelCambio(antes, despues) {
  return MEDIDAS.map((medida) => ({ medida, diferencia: medida.valor(despues) - medida.valor(antes) }))
    .filter(({ diferencia }) => Math.abs(diferencia) > UMBRAL)
    .map(({ medida, diferencia }) => ({
      texto: `${diferencia > 0 ? '+' : '−'}${medida.formato(Math.abs(diferencia))} ${medida.etiqueta}`,
      bueno: diferencia > 0 === medida.mayorEsMejor,
    }))
}
