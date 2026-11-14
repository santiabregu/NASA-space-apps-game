// Une las capas SVG de la escena, tal como se ven ahora, en una sola imagen del tamaño de la ventana.
export function fotografiarEscena(capas) {
  const serializador = new XMLSerializer()
  const contenido = capas.map((capa) => {
    const { left, top, width, height } = capa.getBoundingClientRect()
    const copia = capa.cloneNode(true)
    copia.removeAttribute('class')
    copia.setAttribute('x', left)
    copia.setAttribute('y', top)
    copia.setAttribute('width', width)
    copia.setAttribute('height', height)
    return serializador.serializeToString(copia)
  })
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${innerWidth}" height="${innerHeight}">${contenido.join('')}</svg>`
  return URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
}
