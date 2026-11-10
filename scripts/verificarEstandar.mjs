/**
 * Archivo: verificarEstandar.mjs
 * Módulo: scripts
 * Descripción: Revisa automáticamente las reglas del estándar de codificación CuatroBits que no
 *              cubren Prettier ni oxlint: encabezado de archivo, orden de las secciones,
 *              comentario /** *\/ con @see en lo exportado, nombres de archivos de prueba,
 *              tabulaciones, longitud de línea y código comentado. Uso: pnpm verificar:estandar
 * Requerimientos: RNF10, RNF15
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-11-09
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// ---------- Constantes ----------
/** Carpeta raíz del repositorio */
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
/** Carpetas que se revisan */
const CARPETAS = ['frontend/src', 'backend/src', 'database', 'scripts']
/** Extensiones a las que aplica el estándar */
const EXTENSIONES = ['.ts', '.tsx', '.sql', '.mjs']
/** Campos obligatorios del encabezado, en orden */
const CAMPOS_ENCABEZADO = [
  'Archivo',
  'Módulo',
  'Descripción',
  'Requerimientos',
  'Autores',
  'Fecha',
  'Última modificación',
]
/** Orden en que deben aparecer los comentarios de sección */
const ORDEN_SECCIONES = ['Librerías externas', 'Módulos internos', 'Tipos', 'Constantes']
/** Ancho máximo de línea */
const ANCHO_MAXIMO = 100
/** Declaraciones exportadas que necesitan comentario /** *\/ con @see */
const PATRON_EXPORTADO =
  /^export (default )?(async )?(function|class) \w+|^export const \w+ = (async )?(\(|function)/
/** Línea que parece código desactivado dentro de un comentario // */
const PATRON_CODIGO_COMENTADO =
  /^\s*\/\/\s*(const|let|var|function|return|import|export|if|for|while)\b.*[;{)=]\s*$/

// ---------- Funciones ----------
/**
 * Lista recursivamente los archivos de una carpeta con las extensiones del estándar.
 * @param carpeta Ruta absoluta de la carpeta
 * @returns Rutas absolutas de los archivos
 * @see RNF10
 */
function listarArchivos(carpeta) {
  return readdirSync(carpeta).flatMap((nombre) => {
    const ruta = path.join(carpeta, nombre)
    if (nombre === 'node_modules' || nombre === 'dist') {
      return []
    }
    if (statSync(ruta).isDirectory()) {
      return listarArchivos(ruta)
    }
    return EXTENSIONES.includes(path.extname(nombre)) && !nombre.endsWith('.d.ts') ? [ruta] : []
  })
}

/**
 * Revisa un archivo y devuelve las reglas que no cumple.
 * @param ruta Ruta absoluta del archivo
 * @returns Mensajes con la línea y la regla incumplida
 * @see RNF10
 */
function revisarArchivo(ruta) {
  const relativa = path.relative(RAIZ, ruta)
  const texto = readFileSync(ruta, 'utf8')
  const lineas = texto.split('\n')
  const problemas = []
  const avisar = (linea, mensaje) => problemas.push(`${relativa}:${linea} ${mensaje}`)

  // Encabezado con todos sus campos y el nombre real del archivo
  const encabezado = texto.match(/^\/\*\*\n([\s\S]*?)\*\//)?.[1] ?? ''
  let posicionAnterior = -1
  for (const campo of CAMPOS_ENCABEZADO) {
    const posicion = encabezado.indexOf(` * ${campo}:`)
    if (posicion === -1 || posicion < posicionAnterior) {
      avisar(1, `encabezado sin el campo "${campo}" o fuera de orden`)
    }
    posicionAnterior = posicion
  }
  if (encabezado && !encabezado.includes(`Archivo: ${path.basename(ruta)}`)) {
    avisar(1, 'el campo "Archivo" no coincide con el nombre del archivo')
  }

  // Formato de cada línea
  let blancosSeguidos = 0
  lineas.forEach((linea, indice) => {
    if (linea.includes('\t')) {
      avisar(indice + 1, 'usa tabulaciones en lugar de 2 espacios')
    }
    if (linea.length > ANCHO_MAXIMO) {
      avisar(indice + 1, `línea de ${linea.length} caracteres (máximo ${ANCHO_MAXIMO})`)
    }
    blancosSeguidos = linea.trim() === '' ? blancosSeguidos + 1 : 0
    if (blancosSeguidos === 2) {
      avisar(indice + 1, 'más de una línea en blanco seguida')
    }
    if (PATRON_CODIGO_COMENTADO.test(linea)) {
      avisar(indice + 1, 'parece código comentado')
    }
  })

  if (ruta.endsWith('.sql')) {
    return problemas
  }

  // Secciones en el orden del estándar
  const secciones = [...texto.matchAll(/^\/\/ ---------- (.+) ----------$/gm)].map(
    (coincidencia) => coincidencia[1],
  )
  if (secciones.length === 0) {
    avisar(1, 'no tiene comentarios de sección')
  }
  const indices = secciones.map((seccion) => ORDEN_SECCIONES.indexOf(seccion)).filter((i) => i >= 0)
  if (indices.some((valor, i) => i > 0 && valor < indices[i - 1])) {
    avisar(1, 'las secciones no siguen el orden: librerías, módulos, tipos, constantes, principal')
  }

  // Comentario /** */ con @see antes de cada función o clase exportada
  lineas.forEach((linea, indice) => {
    if (!PATRON_EXPORTADO.test(linea)) {
      return
    }
    let anterior = indice - 1
    while (anterior >= 0 && lineas[anterior].trim().startsWith('//')) {
      anterior--
    }
    if (lineas[anterior]?.trim() !== '*/') {
      avisar(indice + 1, 'exportación sin comentario /** */')
      return
    }
    let inicio = anterior
    while (inicio > 0 && !lineas[inicio].trim().startsWith('/**')) {
      inicio--
    }
    const comentario = lineas.slice(inicio, anterior + 1).join('\n')
    if (!/@see (RF|RNF|RIU|RIE|RE|RDC|RLYE)\d{2}/.test(comentario)) {
      avisar(indice + 1, 'el comentario no indica el requerimiento con @see')
    }
  })

  // Archivos de prueba: <archivo>.test.ts dentro de tests/
  if (relativa.includes(`${path.sep}tests${path.sep}`)) {
    const nombre = path.basename(ruta)
    const esAuxiliar = ['apiFalsa.ts', 'ayudantesPrueba.ts', 'configuracionPruebas.ts'].includes(
      nombre,
    )
    if (!esAuxiliar && !/\.test\.tsx?$/.test(nombre)) {
      avisar(1, 'los archivos de prueba se nombran <archivo>.test.ts')
    }
  }
  return problemas
}

// ---------- Ejecución ----------
const archivos = CARPETAS.flatMap((carpeta) => listarArchivos(path.join(RAIZ, carpeta)))
const problemas = archivos.flatMap(revisarArchivo)
if (problemas.length > 0) {
  console.error(problemas.join('\n'))
  console.error(`\n${problemas.length} incumplimientos en ${archivos.length} archivos revisados.`)
  process.exit(1)
}
console.log(`Estándar CuatroBits: ${archivos.length} archivos revisados, sin incumplimientos.`)
