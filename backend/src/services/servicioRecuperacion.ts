/**
 * Archivo: servicioRecuperacion.ts
 * Módulo: backend / services
 * Descripción: Recuperación de perfiles en otro dispositivo con el código secreto, con límite de
 *              intentos.
 * Requerimientos: RNF12, RLYE02, RF61
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Módulos internos ----------
import type { BaseDatos } from '../config/baseDatos.js'
import { cifrarToken } from '../models/autenticacion.js'
import { ErrorAplicacion } from '../models/errores.js'
import {
  generarCodigoRecuperacion,
  cifrarCodigoRecuperacion,
  verificarCodigoRecuperacion,
} from '../models/recuperacion.js'
import { normalizarUsername } from '../models/esquemas.js'
import { listarPartidas } from '../repositories/repositorioPartidas.js'
import {
  buscarJugadorPorUsername,
  asignarHashRecuperacion,
} from '../repositories/repositorioJugadores.js'
import { agregarToken } from '../repositories/repositorioTokens.js'
import { obtenerJugador, requerirJugador, aPartidaDto } from './servicioJugadores.js'

// ---------- Constantes ----------
/** Partidas que se devuelven al recuperar un perfil */
const MAX_PARTIDAS_RECUPERADAS = 5000

// ---------- Servicio ----------
/**
 * Limita los intentos fallidos por nombre para que no se pueda adivinar el código probando. Vive en
 * memoria: cada instancia del servidor lleva su propia cuenta.
 * @see RNF12
 */
export class LimitadorIntentos {
  /** Fallos recientes por nombre normalizado y momento en que se olvidan */
  private readonly fallos = new Map<string, { cantidad: number; restableceEn: number }>()

  /**
   * @param maximoFallos Intentos fallidos permitidos antes de bloquear
   * @param ventanaMs Tiempo en milisegundos que dura el bloqueo desde el primer fallo
   * @param ahora Reloj; las pruebas lo reemplazan para no esperar
   * @see RNF12
   */
  constructor(
    private readonly maximoFallos = 5,
    private readonly ventanaMs = 15 * 60 * 1000,
    private readonly ahora: () => number = Date.now,
  ) {}

  /**
   * Indica si el nombre agotó sus intentos; si la ventana ya pasó, olvida los fallos.
   * @param clave Nombre de usuario normalizado
   * @returns true si debe rechazarse el intento
   * @see RNF12
   */
  estaBloqueado(clave: string): boolean {
    const entrada = this.fallos.get(clave)
    if (!entrada) {
      return false
    }
    if (entrada.restableceEn <= this.ahora()) {
      this.fallos.delete(clave)
      return false
    }
    return entrada.cantidad >= this.maximoFallos
  }

  /**
   * Registra un intento fallido.
   * @param clave Nombre de usuario normalizado
   * @see RNF12
   */
  fallar(clave: string) {
    const entrada = this.fallos.get(clave)
    if (!entrada || entrada.restableceEn <= this.ahora()) {
      this.fallos.set(clave, { cantidad: 1, restableceEn: this.ahora() + this.ventanaMs })
    } else {
      entrada.cantidad++
    }
  }

  /**
   * Olvida los fallos del nombre tras una recuperación correcta.
   * @param clave Nombre de usuario normalizado
   * @see RNF12
   */
  restablecer(clave: string) {
    this.fallos.delete(clave)
  }
}

/**
 * Crea el código de un perfil registrado antes de existir los códigos. Solo funciona una vez:
 * después, nadie más puede reemplazarlo con solo conocer el identificador.
 * @param baseDatos Conexión con la base de datos o transacción en curso
 * @param id Identificador del jugador
 * @returns Código secreto nuevo
 * @see RNF12
 */
export async function crearCodigoRecuperacion(baseDatos: BaseDatos, id: string): Promise<string> {
  await requerirJugador(baseDatos, id)
  const codigo = generarCodigoRecuperacion()
  if (!(await asignarHashRecuperacion(baseDatos, id, await cifrarCodigoRecuperacion(codigo)))) {
    throw new ErrorAplicacion(409, 'code-exists', 'Este perfil ya tiene un código secreto.')
  }
  return codigo
}

const invalido = () =>
  new ErrorAplicacion(401, 'invalid-recovery', 'El nombre o el código secreto no son correctos.')

/**
 * Devuelve el perfil completo y su historial si el código corresponde al nombre, y autoriza el
 * token del nuevo dispositivo. Los demás dispositivos del jugador conservan su sesión.
 * @param baseDatos Conexión con la base de datos o transacción en curso
 * @param limitador Limitador de intentos fallidos de recuperación
 * @param datosEntrada Cuerpo de la solicitud, todavía sin validar
 * @returns Perfil, historial y código formateado
 * @see RNF12, RLYE02
 */
export async function recuperarJugador(
  baseDatos: BaseDatos,
  limitador: LimitadorIntentos,
  datosEntrada: { username: string; codigo: string; token: string },
) {
  const { username, codigo } = datosEntrada
  const normalizado = normalizarUsername(username)
  if (limitador.estaBloqueado(normalizado)) {
    throw new ErrorAplicacion(
      429,
      'too-many-attempts',
      'Demasiados intentos. Espera unos minutos y vuelve a intentarlo.',
    )
  }
  const fila = await buscarJugadorPorUsername(baseDatos, normalizado)
  if (
    !fila?.hash_recuperacion ||
    !(await verificarCodigoRecuperacion(codigo, fila.hash_recuperacion))
  ) {
    limitador.fallar(normalizado)
    throw invalido()
  }
  limitador.restablecer(normalizado)
  if (!(await agregarToken(baseDatos, fila.id, cifrarToken(datosEntrada.token)))) {
    throw new ErrorAplicacion(409, 'token-taken', 'Ese token ya pertenece a otro jugador.')
  }
  const { partidas } = await listarPartidas(baseDatos, fila.id, MAX_PARTIDAS_RECUPERADAS, 0)
  return { jugador: await obtenerJugador(baseDatos, fila.id), partidas: partidas.map(aPartidaDto) }
}
