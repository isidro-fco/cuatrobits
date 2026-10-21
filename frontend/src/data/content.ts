// Catálogo de contenido compartido por Arma a BitBot y Memorama (secciones 6.2 y 8.2)
import type { CategoryId } from '../types'

export interface WordEntry {
  /** Respuesta correcta en mayúsculas, con tildes */
  word: string
  hint: string
}

export interface ImageEntry {
  emoji: string
  name: string
}

export interface CategoryContent {
  words: WordEntry[]
  /** Al menos 18 imágenes, las necesarias para la dificultad Experto */
  images: ImageEntry[]
}

const img = (pairs: string): ImageEntry[] =>
  pairs
    .trim()
    .split('\n')
    .map((line) => {
      const [emoji, name] = line.trim().split(/\s+(.+)/)
      return { emoji, name }
    })

export const CONTENT: Record<CategoryId, CategoryContent> = {
  animals: {
    words: [
      { word: 'GATO', hint: 'Dice miau y le encanta dormir.' },
      { word: 'PERRO', hint: 'Mueve la cola cuando está feliz.' },
      { word: 'PATO', hint: 'Nada en el estanque y dice cuac.' },
      { word: 'VACA', hint: 'Nos da leche y dice muu.' },
      { word: 'LEÓN', hint: 'Tiene melena y es el rey de la selva.' },
      { word: 'OSO', hint: 'Es grande, peludo y le gusta la miel.' },
      { word: 'CONEJO', hint: 'Tiene orejas largas y come zanahorias.' },
      { word: 'TORTUGA', hint: 'Camina despacio y lleva su casa en la espalda.' },
      { word: 'PINGÜINO', hint: 'Es un ave que no vuela y vive en el frío.' },
      { word: 'JIRAFA', hint: 'Tiene el cuello muy largo.' },
    ],
    images: img(`
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
    `),
  },
  colors: {
    words: [
      { word: 'ROJO', hint: 'El color de las fresas.' },
      { word: 'AZUL', hint: 'El color del cielo en un día despejado.' },
      { word: 'VERDE', hint: 'El color del pasto.' },
      { word: 'AMARILLO', hint: 'El color del sol y de los plátanos.' },
      { word: 'NARANJA', hint: 'Un color y también una fruta.' },
      { word: 'MORADO', hint: 'El color de las uvas.' },
      { word: 'ROSA', hint: 'Un color y también una flor.' },
      { word: 'BLANCO', hint: 'El color de la nieve.' },
      { word: 'NEGRO', hint: 'El color de la noche sin luna.' },
      { word: 'GRIS', hint: 'El color de las nubes de lluvia.' },
    ],
    images: img(`
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
    `),
  },
  fruits: {
    words: [
      { word: 'PERA', hint: 'Es verde o amarilla y tiene forma de gota.' },
      { word: 'UVA', hint: 'Crece en racimos.' },
      { word: 'FRESA', hint: 'Es roja y tiene semillas por fuera.' },
      { word: 'MANZANA', hint: 'Puede ser roja o verde y cruje al morderla.' },
      { word: 'PLÁTANO', hint: 'Es amarillo y se pela fácilmente.' },
      { word: 'SANDÍA', hint: 'Es verde por fuera y roja por dentro.' },
      { word: 'PIÑA', hint: 'Tiene una corona de hojas.' },
      { word: 'LIMÓN', hint: 'Es ácido y amarillo o verde.' },
      { word: 'MANGO', hint: 'Es dulce, jugoso y tiene un hueso grande.' },
      { word: 'CEREZA', hint: 'Es pequeña, roja y viene en pares.' },
    ],
    images: img(`
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
    `),
  },
  school: {
    words: [
      { word: 'LÁPIZ', hint: 'Sirve para escribir y se puede borrar.' },
      { word: 'LIBRO', hint: 'Tiene muchas páginas para leer.' },
      { word: 'REGLA', hint: 'Sirve para medir y trazar líneas rectas.' },
      { word: 'MOCHILA', hint: 'La llevas en la espalda con tus útiles.' },
      { word: 'GOMA', hint: 'Borra lo que escribiste con lápiz.' },
      { word: 'TIJERAS', hint: 'Sirven para recortar papel.' },
      { word: 'CUADERNO', hint: 'En él escribes tus tareas.' },
      { word: 'MAESTRA', hint: 'Enseña en el salón de clases.' },
      { word: 'PIZARRÓN', hint: 'Está al frente del salón y se escribe en él.' },
      { word: 'RECREO', hint: 'El momento para jugar en la escuela.' },
    ],
    images: img(`
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
    `),
  },
  transport: {
    words: [
      { word: 'BARCO', hint: 'Navega por el mar.' },
      { word: 'AVIÓN', hint: 'Vuela muy alto con alas.' },
      { word: 'TREN', hint: 'Viaja sobre vías.' },
      { word: 'BICICLETA', hint: 'Tiene dos ruedas y pedales.' },
      { word: 'AUTOBÚS', hint: 'Lleva a muchas personas por la ciudad.' },
      { word: 'TAXI', hint: 'Es un auto que te lleva a donde pidas.' },
      { word: 'CAMIÓN', hint: 'Es grande y transporta carga.' },
      { word: 'METRO', hint: 'Es un tren que viaja bajo la tierra.' },
      { word: 'MOTO', hint: 'Tiene dos ruedas y motor.' },
      { word: 'HELICÓPTERO', hint: 'Vuela con hélices que giran arriba.' },
    ],
    images: img(`
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
    `),
  },
  nature: {
    words: [
      { word: 'ÁRBOL', hint: 'Tiene tronco, ramas y hojas.' },
      { word: 'FLOR', hint: 'Es colorida y las abejas la visitan.' },
      { word: 'RÍO', hint: 'Agua que corre hasta el mar.' },
      { word: 'MONTAÑA', hint: 'Es muy alta y se puede escalar.' },
      { word: 'LLUVIA', hint: 'Agua que cae de las nubes.' },
      { word: 'BOSQUE', hint: 'Lugar con muchos árboles.' },
      { word: 'HOJA', hint: 'Es verde y crece en las ramas.' },
      { word: 'PLAYA', hint: 'Tiene arena y olas.' },
      { word: 'VOLCÁN', hint: 'Una montaña que puede echar lava.' },
      { word: 'ARCOÍRIS', hint: 'Aparece con sol y lluvia, y tiene muchos colores.' },
    ],
    images: img(`
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
    `),
  },
  space: {
    words: [
      { word: 'PLANETA', hint: 'La Tierra es uno de ellos.' },
      { word: 'ESTRELLA', hint: 'Brilla en el cielo de noche.' },
      { word: 'COHETE', hint: 'Despega hacia el espacio.' },
      { word: 'LUNA', hint: 'Gira alrededor de la Tierra.' },
      { word: 'COMETA', hint: 'Viaja por el espacio con una cola brillante.' },
      { word: 'GALAXIA', hint: 'Un enorme grupo de estrellas.' },
      { word: 'ASTRONAUTA', hint: 'Persona que viaja al espacio.' },
      { word: 'SATÉLITE', hint: 'Gira alrededor de un planeta.' },
      { word: 'TELESCOPIO', hint: 'Sirve para ver objetos lejanos en el cielo.' },
      { word: 'ÓRBITA', hint: 'El camino que sigue un planeta alrededor del Sol.' },
    ],
    images: img(`
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
    `),
  },
  technology: {
    words: [
      { word: 'TECLADO', hint: 'Tiene muchas teclas para escribir.' },
      { word: 'ROBOT', hint: 'Una máquina que puede moverse sola, como BitBot.' },
      { word: 'PANTALLA', hint: 'Allí ves imágenes y videos.' },
      { word: 'RATÓN', hint: 'Lo mueves para controlar la flecha en la computadora.' },
      { word: 'CÁMARA', hint: 'Sirve para tomar fotos.' },
      { word: 'BATERÍA', hint: 'Guarda energía para los aparatos.' },
      { word: 'INTERNET', hint: 'Conecta computadoras de todo el mundo.' },
      { word: 'TABLETA', hint: 'Una pantalla táctil que puedes llevar contigo.' },
      { word: 'CONSOLA', hint: 'Aparato para jugar videojuegos.' },
      { word: 'AUDÍFONOS', hint: 'Te los pones para escuchar música.' },
    ],
    images: img(`
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
    `),
  },
}
