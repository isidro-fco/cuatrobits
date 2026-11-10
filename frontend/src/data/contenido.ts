/**
 * Archivo: contenido.ts
 * Módulo: frontend / data
 * Descripción: Catálogo de palabras e imágenes por categoría (secciones 6.2 y 8.2).
 * Requerimientos: RF23, RF41
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Módulos internos ----------
import type { IdCategoria } from '../types'

// ---------- Tipos ----------
export interface EntradaPalabra {
  /** Respuesta correcta en mayúsculas, con tildes */
  palabra: string
  pista: string
}

export interface EntradaImagen {
  emoji: string
  nombre: string
}

export interface ContenidoCategoria {
  palabras: EntradaPalabra[]
  /** Al menos 18 imágenes, las necesarias para la dificultad Experto */
  imagenes: EntradaImagen[]
}

// ---------- Funciones ----------
const elementoImagen = (parejas: string): EntradaImagen[] =>
  parejas
    .trim()
    .split('\n')
    .map((linea) => {
      const [emoji, nombre] = linea.trim().split(/\s+(.+)/)
      return { emoji, nombre }
    })

/** Palabras con pista e imágenes de cada categoría */
export const CONTENIDO: Record<IdCategoria, ContenidoCategoria> = {
  animals: {
    palabras: [
      { palabra: 'GATO', pista: 'Dice miau y le encanta dormir.' },
      { palabra: 'PERRO', pista: 'Mueve la cola cuando está feliz.' },
      { palabra: 'PATO', pista: 'Nada en el estanque y dice cuac.' },
      { palabra: 'VACA', pista: 'Nos da leche y dice muu.' },
      { palabra: 'LEÓN', pista: 'Tiene melena y es el rey de la selva.' },
      { palabra: 'OSO', pista: 'Es grande, peludo y le gusta la miel.' },
      { palabra: 'CONEJO', pista: 'Tiene orejas largas y come zanahorias.' },
      { palabra: 'TORTUGA', pista: 'Camina despacio y lleva su casa en la espalda.' },
      { palabra: 'PINGÜINO', pista: 'Es un ave que no vuela y vive en el frío.' },
      { palabra: 'JIRAFA', pista: 'Tiene el cuello muy largo.' },
      { palabra: 'CABALLO', pista: 'Galopa rápido y tiene crin.' },
      { palabra: 'ELEFANTE', pista: 'Es enorme y tiene trompa.' },
      { palabra: 'MONO', pista: 'Trepa árboles y come plátanos.' },
      { palabra: 'RANA', pista: 'Es verde, salta y dice croac.' },
      { palabra: 'TIGRE', pista: 'Es un gran felino con rayas.' },
      { palabra: 'CERDO', pista: 'Es rosado y le gusta el lodo.' },
      { palabra: 'OVEJA', pista: 'Su lana sirve para hacer suéteres.' },
      { palabra: 'GALLINA', pista: 'Pone huevos y cacarea en la granja.' },
      { palabra: 'BALLENA', pista: 'Es el animal más grande del mar.' },
      { palabra: 'DELFÍN', pista: 'Vive en el mar, es muy listo y salta entre las olas.' },
      { palabra: 'ABEJA', pista: 'Hace miel y vuela de flor en flor.' },
      { palabra: 'MARIPOSA', pista: 'Tiene alas de colores y antes fue oruga.' },
      { palabra: 'CEBRA', pista: 'Parece un caballo con rayas blancas y negras.' },
      { palabra: 'BURRO', pista: 'Tiene orejas largas y dice iii-aaa.' },
      { palabra: 'BÚHO', pista: 'Ave que sale de noche y gira mucho la cabeza.' },
    ],
    imagenes: elementoImagen(`
      🐶 perro
      🐱 gato
      🐭 ratón
      🐰 conejo
      🦊 zorro
      🐻 oso
      🐼 panda
      🐨 koala
      🐯 tigre
      🦁 león
      🐮 vaca
      🐷 cerdo
      🐸 rana
      🐵 mono
      🐔 gallina
      🐧 pingüino
      🐢 tortuga
      🐙 pulpo
      🐴 caballo
      🐘 elefante
      🦒 jirafa
      🦓 cebra
      🐑 oveja
      🐐 cabra
      🦆 pato
      🦉 búho
      🐝 abeja
      🦋 mariposa
      🐬 delfín
      🐳 ballena
    `),
  },
  colors: {
    palabras: [
      { palabra: 'ROJO', pista: 'El color de las fresas.' },
      { palabra: 'AZUL', pista: 'El color del cielo en un día despejado.' },
      { palabra: 'VERDE', pista: 'El color del pasto.' },
      { palabra: 'AMARILLO', pista: 'El color del sol y de los plátanos.' },
      { palabra: 'NARANJA', pista: 'Un color y también una fruta.' },
      { palabra: 'MORADO', pista: 'El color de las uvas.' },
      { palabra: 'ROSA', pista: 'Un color y también una flor.' },
      { palabra: 'BLANCO', pista: 'El color de la nieve.' },
      { palabra: 'NEGRO', pista: 'El color de la noche sin luna.' },
      { palabra: 'GRIS', pista: 'El color de las nubes de lluvia.' },
      { palabra: 'CAFÉ', pista: 'El color del chocolate y de la tierra.' },
      { palabra: 'DORADO', pista: 'El color de las medallas de primer lugar.' },
      { palabra: 'PLATEADO', pista: 'El color brillante de las monedas y las cucharas.' },
      { palabra: 'CELESTE', pista: 'Un azul claro, como el cielo de la mañana.' },
      { palabra: 'TURQUESA', pista: 'Mezcla de azul y verde, como el mar del Caribe.' },
      { palabra: 'LILA', pista: 'Un morado muy clarito.' },
      { palabra: 'VIOLETA', pista: 'Un morado que también es nombre de una flor.' },
      { palabra: 'CREMA', pista: 'Un blanco amarillento, como la vainilla.' },
      { palabra: 'FUCSIA', pista: 'Un rosa muy intenso y brillante.' },
      { palabra: 'CORAL', pista: 'Un rosa anaranjado, como algo que vive en el mar.' },
      { palabra: 'MAGENTA', pista: 'Un color entre rosa y morado que usan las impresoras.' },
      { palabra: 'ESMERALDA', pista: 'Un verde brillante, como una piedra preciosa.' },
    ],
    imagenes: elementoImagen(`
      🔴 círculo rojo
      🟠 círculo naranja
      🟡 círculo amarillo
      🟢 círculo verde
      🔵 círculo azul
      🟣 círculo morado
      🟤 círculo café
      ⚫ círculo negro
      ⚪ círculo blanco
      🟥 cuadrado rojo
      🟧 cuadrado naranja
      🟨 cuadrado amarillo
      🟩 cuadrado verde
      🟦 cuadrado azul
      🟪 cuadrado morado
      🟫 cuadrado café
      ⬛ cuadrado negro
      ⬜ cuadrado blanco
      ❤️ corazón rojo
      🧡 corazón naranja
      💛 corazón amarillo
      💚 corazón verde
      💙 corazón azul
      💜 corazón morado
      🤎 corazón café
      🖤 corazón negro
      🤍 corazón blanco
      🔶 rombo naranja
      🔷 rombo azul
      🔺 triángulo rojo
    `),
  },
  fruits: {
    palabras: [
      { palabra: 'PERA', pista: 'Es verde o amarilla y tiene forma de gota.' },
      { palabra: 'UVA', pista: 'Crece en racimos.' },
      { palabra: 'FRESA', pista: 'Es roja y tiene semillas por fuera.' },
      { palabra: 'MANZANA', pista: 'Puede ser roja o verde y cruje al morderla.' },
      { palabra: 'PLÁTANO', pista: 'Es amarillo y se pela fácilmente.' },
      { palabra: 'SANDÍA', pista: 'Es verde por fuera y roja por dentro.' },
      { palabra: 'PIÑA', pista: 'Tiene una corona de hojas.' },
      { palabra: 'LIMÓN', pista: 'Es ácido y amarillo o verde.' },
      { palabra: 'MANGO', pista: 'Es dulce, jugoso y tiene un hueso grande.' },
      { palabra: 'CEREZA', pista: 'Es pequeña, roja y viene en pares.' },
      { palabra: 'COCO', pista: 'Tiene cáscara dura y agua por dentro.' },
      { palabra: 'KIWI', pista: 'Es café y peludo por fuera y verde por dentro.' },
      { palabra: 'MELÓN', pista: 'Es redondo, dulce y anaranjado por dentro.' },
      { palabra: 'DURAZNO', pista: 'Tiene piel suavecita y un hueso en medio.' },
      { palabra: 'NARANJA', pista: 'Es redonda y con ella se hace jugo.' },
      { palabra: 'PAPAYA', pista: 'Es naranja por dentro y tiene semillas negras.' },
      { palabra: 'GUAYABA', pista: 'Es amarilla, huele rico y se usa en el ponche.' },
      { palabra: 'MANDARINA', pista: 'Parece una naranja pequeña y se pela fácil.' },
      { palabra: 'FRAMBUESA', pista: 'Es roja, pequeña y parece hecha de bolitas.' },
      { palabra: 'CIRUELA', pista: 'Es morada o roja, jugosa y tiene hueso.' },
      { palabra: 'TORONJA', pista: 'Se parece a la naranja, pero es más grande y amarga.' },
      { palabra: 'GRANADA', pista: 'Por dentro tiene muchas semillas rojas brillantes.' },
      { palabra: 'MORA', pista: 'Es pequeña, oscura y crece en arbustos.' },
      { palabra: 'AGUACATE', pista: 'Es verde, cremoso y con él se hace guacamole.' },
    ],
    imagenes: elementoImagen(`
      🍎 manzana
      🍐 pera
      🍊 naranja
      🍋 limón
      🍌 plátano
      🍉 sandía
      🍇 uvas
      🍓 fresa
      🫐 arándanos
      🍈 melón
      🍒 cerezas
      🍑 durazno
      🥭 mango
      🍍 piña
      🥥 coco
      🥝 kiwi
      🍅 tomate
      🥑 aguacate
      🍏 manzana verde
      🫒 aceitunas
      🌰 castaña
    `),
  },
  school: {
    palabras: [
      { palabra: 'LÁPIZ', pista: 'Sirve para escribir y se puede borrar.' },
      { palabra: 'LIBRO', pista: 'Tiene muchas páginas para leer.' },
      { palabra: 'REGLA', pista: 'Sirve para medir y trazar líneas rectas.' },
      { palabra: 'MOCHILA', pista: 'La llevas en la espalda con tus útiles.' },
      { palabra: 'GOMA', pista: 'Borra lo que escribiste con lápiz.' },
      { palabra: 'TIJERAS', pista: 'Sirven para recortar papel.' },
      { palabra: 'CUADERNO', pista: 'En él escribes tus tareas.' },
      { palabra: 'MAESTRA', pista: 'Enseña en el salón de clases.' },
      { palabra: 'PIZARRÓN', pista: 'Está al frente del salón y se escribe en él.' },
      { palabra: 'RECREO', pista: 'El momento para jugar en la escuela.' },
      { palabra: 'PLUMA', pista: 'Escribe con tinta.' },
      { palabra: 'CRAYÓN', pista: 'Es de cera y sirve para colorear.' },
      { palabra: 'PINCEL', pista: 'Lo mojas en pintura para pintar.' },
      { palabra: 'SACAPUNTAS', pista: 'Le saca punta al lápiz.' },
      { palabra: 'PUPITRE', pista: 'La mesa donde te sientas en el salón.' },
      { palabra: 'SALÓN', pista: 'El lugar de la escuela donde tomas clases.' },
      { palabra: 'TAREA', pista: 'Trabajo de la escuela que haces en casa.' },
      { palabra: 'ALUMNO', pista: 'Persona que va a la escuela a aprender.' },
      { palabra: 'ESCUADRA', pista: 'Regla con forma de triángulo.' },
      { palabra: 'COMPÁS', pista: 'Sirve para dibujar círculos perfectos.' },
      { palabra: 'PEGAMENTO', pista: 'Sirve para unir papeles.' },
      { palabra: 'CALCULADORA', pista: 'Hace sumas y restas muy rápido.' },
      { palabra: 'MAPA', pista: 'Dibujo que muestra países, ciudades y caminos.' },
      { palabra: 'EXAMEN', pista: 'Prueba para saber cuánto aprendiste.' },
    ],
    imagenes: elementoImagen(`
      ✏️ lápiz
      🖍️ crayón
      🖊️ pluma
      📏 regla
      📐 escuadra
      ✂️ tijeras
      📚 libros
      📓 cuaderno
      🎒 mochila
      🖌️ pincel
      📎 clip
      📌 chincheta
      🧮 ábaco
      🔬 microscopio
      🌍 globo terráqueo
      🧪 tubo de ensayo
      🎨 paleta de pintura
      🔔 campana
      📖 libro abierto
      📝 nota
      📒 libreta
      📋 portapapeles
      📅 calendario
      🗺️ mapa
      🖇️ clips unidos
      🏫 escuela
      🎓 birrete
      🧑‍🏫 maestro
      🧑‍🎓 estudiante
      🗒️ bloc de notas
    `),
  },
  transport: {
    palabras: [
      { palabra: 'BARCO', pista: 'Navega por el mar.' },
      { palabra: 'AVIÓN', pista: 'Vuela muy alto con alas.' },
      { palabra: 'TREN', pista: 'Viaja sobre vías.' },
      { palabra: 'BICICLETA', pista: 'Tiene dos ruedas y pedales.' },
      { palabra: 'AUTOBÚS', pista: 'Lleva a muchas personas por la ciudad.' },
      { palabra: 'TAXI', pista: 'Es un auto que te lleva a donde pidas.' },
      { palabra: 'CAMIÓN', pista: 'Es grande y transporta carga.' },
      { palabra: 'METRO', pista: 'Es un tren que viaja bajo la tierra.' },
      { palabra: 'MOTO', pista: 'Tiene dos ruedas y motor.' },
      { palabra: 'HELICÓPTERO', pista: 'Vuela con hélices que giran arriba.' },
      { palabra: 'AUTO', pista: 'Tiene cuatro ruedas y lleva a la familia.' },
      { palabra: 'TRACTOR', pista: 'Trabaja en el campo con ruedas enormes.' },
      { palabra: 'AMBULANCIA', pista: 'Lleva a los enfermos al hospital con sirena.' },
      { palabra: 'PATRULLA', pista: 'Es el auto de la policía.' },
      { palabra: 'CANOA', pista: 'Bote angosto que se mueve con remos.' },
      { palabra: 'VELERO', pista: 'Barco que avanza con el viento en sus velas.' },
      { palabra: 'SUBMARINO', pista: 'Viaja por debajo del agua.' },
      { palabra: 'GLOBO', pista: 'Vuela con aire caliente y lleva una canasta.' },
      { palabra: 'PATINETA', pista: 'Tabla con ruedas para deslizarte.' },
      { palabra: 'TRANVÍA', pista: 'Tren pequeño que va por las calles de la ciudad.' },
      { palabra: 'CAMIONETA', pista: 'Auto grande con espacio para cargar cosas.' },
      { palabra: 'YATE', pista: 'Barco elegante para pasear en el mar.' },
      { palabra: 'TELEFÉRICO', pista: 'Cabina que cuelga de un cable para subir montañas.' },
      { palabra: 'LANCHA', pista: 'Bote con motor que va rápido en el agua.' },
    ],
    imagenes: elementoImagen(`
      🚗 auto
      🚕 taxi
      🚌 autobús
      🚑 ambulancia
      🚒 camión de bomberos
      🚓 patrulla
      🚜 tractor
      🚲 bicicleta
      🛴 patín del diablo
      🏍️ motocicleta
      🚂 tren
      ✈️ avión
      🚁 helicóptero
      ⛵ velero
      🚢 barco
      🚀 cohete
      🛶 canoa
      🚚 camión
      🚙 camioneta
      🏎️ auto de carreras
      🚐 combi
      🚛 tráiler
      🛵 motoneta
      🚋 tranvía
      🚄 tren bala
      🚤 lancha
      🛳️ crucero
      🚡 teleférico
      🛹 patineta
      🛩️ avioneta
    `),
  },
  nature: {
    palabras: [
      { palabra: 'ÁRBOL', pista: 'Tiene tronco, ramas y hojas.' },
      { palabra: 'FLOR', pista: 'Es colorida y las abejas la visitan.' },
      { palabra: 'RÍO', pista: 'Agua que corre hasta el mar.' },
      { palabra: 'MONTAÑA', pista: 'Es muy alta y se puede escalar.' },
      { palabra: 'LLUVIA', pista: 'Agua que cae de las nubes.' },
      { palabra: 'BOSQUE', pista: 'Lugar con muchos árboles.' },
      { palabra: 'HOJA', pista: 'Es verde y crece en las ramas.' },
      { palabra: 'PLAYA', pista: 'Tiene arena y olas.' },
      { palabra: 'VOLCÁN', pista: 'Una montaña que puede echar lava.' },
      { palabra: 'ARCOÍRIS', pista: 'Aparece con sol y lluvia, y tiene muchos colores.' },
      { palabra: 'NUBE', pista: 'Es blanca, esponjosa y flota en el cielo.' },
      { palabra: 'SOL', pista: 'Nos da luz y calor durante el día.' },
      { palabra: 'MAR', pista: 'Agua salada muy grande y profunda.' },
      { palabra: 'LAGO', pista: 'Agua dulce rodeada de tierra.' },
      { palabra: 'PIEDRA', pista: 'Es dura y la encuentras en el suelo.' },
      { palabra: 'ARENA', pista: 'Granitos que hay en la playa y el desierto.' },
      { palabra: 'SEMILLA', pista: 'De ella nace una planta nueva.' },
      { palabra: 'CACTUS', pista: 'Planta con espinas que vive en el desierto.' },
      { palabra: 'NIEVE', pista: 'Cae del cielo cuando hace mucho frío.' },
      { palabra: 'VIENTO', pista: 'Aire en movimiento que mueve las hojas.' },
      { palabra: 'CASCADA', pista: 'Agua que cae desde lo alto de una roca.' },
      { palabra: 'SELVA', pista: 'Lugar caluroso con muchas plantas y animales.' },
      { palabra: 'DESIERTO', pista: 'Lugar muy seco con mucha arena.' },
      { palabra: 'ISLA', pista: 'Tierra rodeada de agua por todos lados.' },
    ],
    imagenes: elementoImagen(`
      🌳 árbol
      🌲 pino
      🌵 cactus
      🌻 girasol
      🌷 tulipán
      🌹 rosa
      🍁 hoja de arce
      🍄 hongo
      🌈 arcoíris
      ☀️ sol
      🌙 luna
      ⭐ estrella
      ☁️ nube
      ❄️ copo de nieve
      🌊 ola
      🔥 fuego
      🌋 volcán
      🐚 concha
      🌴 palmera
      🌱 brote
      🌿 hierba
      🍀 trébol
      🌾 espiga
      🌸 flor de cerezo
      🌼 margarita
      🍂 hojas secas
      ⛰️ montaña
      🏝️ isla
      💧 gota
      ⚡ rayo
    `),
  },
  space: {
    palabras: [
      { palabra: 'PLANETA', pista: 'La Tierra es uno de ellos.' },
      { palabra: 'ESTRELLA', pista: 'Brilla en el cielo de noche.' },
      { palabra: 'COHETE', pista: 'Despega hacia el espacio.' },
      { palabra: 'LUNA', pista: 'Gira alrededor de la Tierra.' },
      { palabra: 'COMETA', pista: 'Viaja por el espacio con una cola brillante.' },
      { palabra: 'GALAXIA', pista: 'Un enorme grupo de estrellas.' },
      { palabra: 'ASTRONAUTA', pista: 'Persona que viaja al espacio.' },
      { palabra: 'SATÉLITE', pista: 'Gira alrededor de un planeta.' },
      { palabra: 'TELESCOPIO', pista: 'Sirve para ver objetos lejanos en el cielo.' },
      { palabra: 'ÓRBITA', pista: 'El camino que sigue un planeta alrededor del Sol.' },
      { palabra: 'SOL', pista: 'La estrella más cercana a la Tierra.' },
      { palabra: 'MARTE', pista: 'El planeta rojo.' },
      { palabra: 'TIERRA', pista: 'El planeta donde vivimos.' },
      { palabra: 'JÚPITER', pista: 'El planeta más grande del sistema solar.' },
      { palabra: 'SATURNO', pista: 'El planeta famoso por sus anillos.' },
      { palabra: 'VENUS', pista: 'El planeta más caliente del sistema solar.' },
      { palabra: 'MERCURIO', pista: 'El planeta más cercano al Sol.' },
      { palabra: 'ECLIPSE', pista: 'Cuando la Luna tapa al Sol, o la Tierra tapa a la Luna.' },
      { palabra: 'METEORITO', pista: 'Roca del espacio que cae en la Tierra.' },
      { palabra: 'UNIVERSO', pista: 'Todo lo que existe: estrellas, planetas y galaxias.' },
      { palabra: 'CRÁTER', pista: 'Hoyo redondo que deja una roca al chocar.' },
      { palabra: 'GRAVEDAD', pista: 'La fuerza que hace que las cosas caigan.' },
      { palabra: 'CONSTELACIÓN', pista: 'Grupo de estrellas que forma una figura.' },
      { palabra: 'NEBULOSA', pista: 'Nube de gas y polvo donde nacen las estrellas.' },
    ],
    imagenes: elementoImagen(`
      🚀 cohete
      🛸 platillo volador
      🌍 Tierra
      🌙 luna
      ☀️ sol
      ⭐ estrella
      🌟 estrella brillante
      ☄️ cometa
      🪐 planeta con anillos
      🧑‍🚀 astronauta
      🛰️ satélite
      🔭 telescopio
      🌌 galaxia
      🌠 estrella fugaz
      👽 extraterrestre
      🌑 luna nueva
      🌕 luna llena
      🌓 cuarto creciente
      🌞 sol sonriente
      🌝 luna sonriente
      🌛 luna con cara
      ✨ destellos
      💫 estrellas girando
      👾 marcianito
      🌃 noche estrellada
      🌎 Tierra desde América
      🌔 luna gibosa
      🌗 cuarto menguante
      🌒 luna creciente
      🌘 luna menguante
    `),
  },
  technology: {
    palabras: [
      { palabra: 'TECLADO', pista: 'Tiene muchas teclas para escribir.' },
      { palabra: 'ROBOT', pista: 'Una máquina que puede moverse sola, como BitBot.' },
      { palabra: 'PANTALLA', pista: 'Allí ves imágenes y videos.' },
      { palabra: 'RATÓN', pista: 'Lo mueves para controlar la flecha en la computadora.' },
      { palabra: 'CÁMARA', pista: 'Sirve para tomar fotos.' },
      { palabra: 'BATERÍA', pista: 'Guarda energía para los aparatos.' },
      { palabra: 'INTERNET', pista: 'Conecta computadoras de todo el mundo.' },
      { palabra: 'TABLETA', pista: 'Una pantalla táctil que puedes llevar contigo.' },
      { palabra: 'CONSOLA', pista: 'Aparato para jugar videojuegos.' },
      { palabra: 'AUDÍFONOS', pista: 'Te los pones para escuchar música.' },
      { palabra: 'COMPUTADORA', pista: 'Máquina para trabajar, aprender y jugar.' },
      { palabra: 'CELULAR', pista: 'Teléfono que llevas en el bolsillo.' },
      { palabra: 'IMPRESORA', pista: 'Pasa lo de la pantalla al papel.' },
      { palabra: 'ANTENA', pista: 'Recibe señales de radio o televisión.' },
      { palabra: 'CABLE', pista: 'Lleva la electricidad de un lugar a otro.' },
      { palabra: 'ENCHUFE', pista: 'Ahí conectas los aparatos a la luz.' },
      { palabra: 'BOTÓN', pista: 'Lo presionas para encender algo.' },
      { palabra: 'MICRÓFONO', pista: 'Hace que tu voz se escuche más fuerte.' },
      { palabra: 'BOCINA', pista: 'Por ella sale el sonido y la música.' },
      { palabra: 'VIDEOJUEGO', pista: 'Juego que se juega en una pantalla, como CuatroBits.' },
      { palabra: 'PROGRAMA', pista: 'Instrucciones que le dicen a la computadora qué hacer.' },
      { palabra: 'CONTRASEÑA', pista: 'Palabra secreta para entrar a tu cuenta.' },
      { palabra: 'CHIP', pista: 'Pieza pequeñita que funciona como el cerebro de un aparato.' },
      { palabra: 'DRON', pista: 'Aparato que vuela solo y se maneja a control remoto.' },
    ],
    imagenes: elementoImagen(`
      💻 laptop
      🖥️ computadora
      ⌨️ teclado
      🖱️ ratón
      📱 celular
      🎮 control de videojuegos
      🕹️ palanca de juego
      📷 cámara
      🎧 audífonos
      📺 televisión
      🔋 batería
      💡 foco
      🤖 robot
      💾 disquete
      💿 disco
      📡 antena
      ⌚ reloj
      🖨️ impresora
      ☎️ teléfono
      📻 radio
      🎙️ micrófono
      🔌 enchufe
      📹 videocámara
      🎥 cámara de cine
      ⏰ despertador
      🔦 linterna
      🔊 bocina
      📠 fax
      🧲 imán
      📟 localizador
    `),
  },
}
