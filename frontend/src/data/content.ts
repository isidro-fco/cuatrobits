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
      { word: 'CABALLO', hint: 'Galopa rápido y tiene crin.' },
      { word: 'ELEFANTE', hint: 'Es enorme y tiene trompa.' },
      { word: 'MONO', hint: 'Trepa árboles y come plátanos.' },
      { word: 'RANA', hint: 'Es verde, salta y dice croac.' },
      { word: 'TIGRE', hint: 'Es un gran felino con rayas.' },
      { word: 'CERDO', hint: 'Es rosado y le gusta el lodo.' },
      { word: 'OVEJA', hint: 'Su lana sirve para hacer suéteres.' },
      { word: 'GALLINA', hint: 'Pone huevos y cacarea en la granja.' },
      { word: 'BALLENA', hint: 'Es el animal más grande del mar.' },
      { word: 'DELFÍN', hint: 'Vive en el mar, es muy listo y salta entre las olas.' },
      { word: 'ABEJA', hint: 'Hace miel y vuela de flor en flor.' },
      { word: 'MARIPOSA', hint: 'Tiene alas de colores y antes fue oruga.' },
      { word: 'CEBRA', hint: 'Parece un caballo con rayas blancas y negras.' },
      { word: 'BURRO', hint: 'Tiene orejas largas y dice iii-aaa.' },
      { word: 'BÚHO', hint: 'Ave que sale de noche y gira mucho la cabeza.' },
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
      { word: 'CAFÉ', hint: 'El color del chocolate y de la tierra.' },
      { word: 'DORADO', hint: 'El color de las medallas de primer lugar.' },
      { word: 'PLATEADO', hint: 'El color brillante de las monedas y las cucharas.' },
      { word: 'CELESTE', hint: 'Un azul claro, como el cielo de la mañana.' },
      { word: 'TURQUESA', hint: 'Mezcla de azul y verde, como el mar del Caribe.' },
      { word: 'LILA', hint: 'Un morado muy clarito.' },
      { word: 'VIOLETA', hint: 'Un morado que también es nombre de una flor.' },
      { word: 'CREMA', hint: 'Un blanco amarillento, como la vainilla.' },
      { word: 'FUCSIA', hint: 'Un rosa muy intenso y brillante.' },
      { word: 'CORAL', hint: 'Un rosa anaranjado, como algo que vive en el mar.' },
      { word: 'MAGENTA', hint: 'Un color entre rosa y morado que usan las impresoras.' },
      { word: 'ESMERALDA', hint: 'Un verde brillante, como una piedra preciosa.' },
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
      { word: 'COCO', hint: 'Tiene cáscara dura y agua por dentro.' },
      { word: 'KIWI', hint: 'Es café y peludo por fuera y verde por dentro.' },
      { word: 'MELÓN', hint: 'Es redondo, dulce y anaranjado por dentro.' },
      { word: 'DURAZNO', hint: 'Tiene piel suavecita y un hueso en medio.' },
      { word: 'NARANJA', hint: 'Es redonda y con ella se hace jugo.' },
      { word: 'PAPAYA', hint: 'Es naranja por dentro y tiene semillas negras.' },
      { word: 'GUAYABA', hint: 'Es amarilla, huele rico y se usa en el ponche.' },
      { word: 'MANDARINA', hint: 'Parece una naranja pequeña y se pela fácil.' },
      { word: 'FRAMBUESA', hint: 'Es roja, pequeña y parece hecha de bolitas.' },
      { word: 'CIRUELA', hint: 'Es morada o roja, jugosa y tiene hueso.' },
      { word: 'TORONJA', hint: 'Se parece a la naranja, pero es más grande y amarga.' },
      { word: 'GRANADA', hint: 'Por dentro tiene muchas semillas rojas brillantes.' },
      { word: 'MORA', hint: 'Es pequeña, oscura y crece en arbustos.' },
      { word: 'AGUACATE', hint: 'Es verde, cremoso y con él se hace guacamole.' },
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
      🍏 manzana verde
      🫒 aceitunas
      🌰 castaña
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
      { word: 'PLUMA', hint: 'Escribe con tinta.' },
      { word: 'CRAYÓN', hint: 'Es de cera y sirve para colorear.' },
      { word: 'PINCEL', hint: 'Lo mojas en pintura para pintar.' },
      { word: 'SACAPUNTAS', hint: 'Le saca punta al lápiz.' },
      { word: 'PUPITRE', hint: 'La mesa donde te sientas en el salón.' },
      { word: 'SALÓN', hint: 'El lugar de la escuela donde tomas clases.' },
      { word: 'TAREA', hint: 'Trabajo de la escuela que haces en casa.' },
      { word: 'ALUMNO', hint: 'Persona que va a la escuela a aprender.' },
      { word: 'ESCUADRA', hint: 'Regla con forma de triángulo.' },
      { word: 'COMPÁS', hint: 'Sirve para dibujar círculos perfectos.' },
      { word: 'PEGAMENTO', hint: 'Sirve para unir papeles.' },
      { word: 'CALCULADORA', hint: 'Hace sumas y restas muy rápido.' },
      { word: 'MAPA', hint: 'Dibujo que muestra países, ciudades y caminos.' },
      { word: 'EXAMEN', hint: 'Prueba para saber cuánto aprendiste.' },
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
      { word: 'AUTO', hint: 'Tiene cuatro ruedas y lleva a la familia.' },
      { word: 'TRACTOR', hint: 'Trabaja en el campo con ruedas enormes.' },
      { word: 'AMBULANCIA', hint: 'Lleva a los enfermos al hospital con sirena.' },
      { word: 'PATRULLA', hint: 'Es el auto de la policía.' },
      { word: 'CANOA', hint: 'Bote angosto que se mueve con remos.' },
      { word: 'VELERO', hint: 'Barco que avanza con el viento en sus velas.' },
      { word: 'SUBMARINO', hint: 'Viaja por debajo del agua.' },
      { word: 'GLOBO', hint: 'Vuela con aire caliente y lleva una canasta.' },
      { word: 'PATINETA', hint: 'Tabla con ruedas para deslizarte.' },
      { word: 'TRANVÍA', hint: 'Tren pequeño que va por las calles de la ciudad.' },
      { word: 'CAMIONETA', hint: 'Auto grande con espacio para cargar cosas.' },
      { word: 'YATE', hint: 'Barco elegante para pasear en el mar.' },
      { word: 'TELEFÉRICO', hint: 'Cabina que cuelga de un cable para subir montañas.' },
      { word: 'LANCHA', hint: 'Bote con motor que va rápido en el agua.' },
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
      { word: 'NUBE', hint: 'Es blanca, esponjosa y flota en el cielo.' },
      { word: 'SOL', hint: 'Nos da luz y calor durante el día.' },
      { word: 'MAR', hint: 'Agua salada muy grande y profunda.' },
      { word: 'LAGO', hint: 'Agua dulce rodeada de tierra.' },
      { word: 'PIEDRA', hint: 'Es dura y la encuentras en el suelo.' },
      { word: 'ARENA', hint: 'Granitos que hay en la playa y el desierto.' },
      { word: 'SEMILLA', hint: 'De ella nace una planta nueva.' },
      { word: 'CACTUS', hint: 'Planta con espinas que vive en el desierto.' },
      { word: 'NIEVE', hint: 'Cae del cielo cuando hace mucho frío.' },
      { word: 'VIENTO', hint: 'Aire en movimiento que mueve las hojas.' },
      { word: 'CASCADA', hint: 'Agua que cae desde lo alto de una roca.' },
      { word: 'SELVA', hint: 'Lugar caluroso con muchas plantas y animales.' },
      { word: 'DESIERTO', hint: 'Lugar muy seco con mucha arena.' },
      { word: 'ISLA', hint: 'Tierra rodeada de agua por todos lados.' },
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
      { word: 'SOL', hint: 'La estrella más cercana a la Tierra.' },
      { word: 'MARTE', hint: 'El planeta rojo.' },
      { word: 'TIERRA', hint: 'El planeta donde vivimos.' },
      { word: 'JÚPITER', hint: 'El planeta más grande del sistema solar.' },
      { word: 'SATURNO', hint: 'El planeta famoso por sus anillos.' },
      { word: 'VENUS', hint: 'El planeta más caliente del sistema solar.' },
      { word: 'MERCURIO', hint: 'El planeta más cercano al Sol.' },
      { word: 'ECLIPSE', hint: 'Cuando la Luna tapa al Sol, o la Tierra tapa a la Luna.' },
      { word: 'METEORITO', hint: 'Roca del espacio que cae en la Tierra.' },
      { word: 'UNIVERSO', hint: 'Todo lo que existe: estrellas, planetas y galaxias.' },
      { word: 'CRÁTER', hint: 'Hoyo redondo que deja una roca al chocar.' },
      { word: 'GRAVEDAD', hint: 'La fuerza que hace que las cosas caigan.' },
      { word: 'CONSTELACIÓN', hint: 'Grupo de estrellas que forma una figura.' },
      { word: 'NEBULOSA', hint: 'Nube de gas y polvo donde nacen las estrellas.' },
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
      { word: 'COMPUTADORA', hint: 'Máquina para trabajar, aprender y jugar.' },
      { word: 'CELULAR', hint: 'Teléfono que llevas en el bolsillo.' },
      { word: 'IMPRESORA', hint: 'Pasa lo de la pantalla al papel.' },
      { word: 'ANTENA', hint: 'Recibe señales de radio o televisión.' },
      { word: 'CABLE', hint: 'Lleva la electricidad de un lugar a otro.' },
      { word: 'ENCHUFE', hint: 'Ahí conectas los aparatos a la luz.' },
      { word: 'BOTÓN', hint: 'Lo presionas para encender algo.' },
      { word: 'MICRÓFONO', hint: 'Hace que tu voz se escuche más fuerte.' },
      { word: 'BOCINA', hint: 'Por ella sale el sonido y la música.' },
      { word: 'VIDEOJUEGO', hint: 'Juego que se juega en una pantalla, como CuatroBits.' },
      { word: 'PROGRAMA', hint: 'Instrucciones que le dicen a la computadora qué hacer.' },
      { word: 'CONTRASEÑA', hint: 'Palabra secreta para entrar a tu cuenta.' },
      { word: 'CHIP', hint: 'Pieza pequeñita que funciona como el cerebro de un aparato.' },
      { word: 'DRON', hint: 'Aparato que vuela solo y se maneja a control remoto.' },
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
