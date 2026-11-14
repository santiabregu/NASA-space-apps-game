const nombreSinExtension = (ruta) => ruta.split('/').pop().replace(/\.webp$/, '')
const indexarPorNombre = (archivos) =>
  Object.fromEntries(Object.entries(archivos).map(([ruta, url]) => [nombreSinExtension(ruta), url]))

// Each file is named after its id in catalogo.json (e.g. assets/piezas/motor-rayo.webp).
export const IMAGEN_PIEZA = indexarPorNombre(import.meta.glob('./assets/piezas/*.webp', { eager: true, import: 'default' }))
export const BANNER_MISION = indexarPorNombre(import.meta.glob('./assets/misiones/*.webp', { eager: true, import: 'default' }))
