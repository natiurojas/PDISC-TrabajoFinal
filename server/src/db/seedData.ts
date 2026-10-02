/**
 * Catalogo de demo. Los clips de video son 샘플 públicos de Google
 * (proyecto Blender, dominio publico) sirviendo de contenido de relleno:
 * sustituye `videoFile`/`videoUrl` por tus archivos o fuentes reales.
 */
const SAMPLE_BASE = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample';

export interface SeedGenre {
  name: string;
  slug: string;
}

export interface SeedMovie {
  slug: string;
  title: string;
  originalTitle: string;
  tagline: string;
  synopsis: string;
  releaseDate: string;
  runtimeMinutes: number;
  ageRating: string;
  score: number;
  popularity: number;
  genres: string[];
  /** Clave del clip publico reutilizado como fuente de video. */
  videoKey: string;
  featured?: boolean;
}

export const GENRES: SeedGenre[] = [
  { name: 'Accion', slug: 'accion' },
  { name: 'Aventura', slug: 'aventura' },
  { name: 'Animacion', slug: 'animacion' },
  { name: 'Ciencia ficcion', slug: 'ciencia-ficcion' },
  { name: 'Comedia', slug: 'comedia' },
  { name: 'Crimen', slug: 'crimen' },
  { name: 'Documental', slug: 'documental' },
  { name: 'Drama', slug: 'drama' },
  { name: 'Familiar', slug: 'familiar' },
  { name: 'Musical', slug: 'musical' },
  { name: 'Misterio', slug: 'misterio' },
  { name: 'Romance', slug: 'romance' },
  { name: 'Terror', slug: 'terror' },
  { name: 'Thriller', slug: 'thriller' },
];

export const MOVIES: SeedMovie[] = [
  {
    slug: 'la-ultima-senal',
    title: 'La ultima senal',
    originalTitle: 'The Last Signal',
    tagline: 'Cuando la radio calla, alguien sigue escuchando.',
    synopsis:
      'Una ingeniera de telecomunicaciones descubre una emissions imposible en una frecuencia prohibida. La senal organise a un grupo de insomnes que lleva veinte anos buscando a su emisor, y cada noche les devuelve un minuto del mismo dia.',
    releaseDate: '2024-11-08',
    runtimeMinutes: 118,
    ageRating: '16',
    score: 8.4,
    popularity: 96,
    genres: ['ciencia-ficcion', 'misterio', 'thriller'],
    videoKey: 'TearsOfSteel',
    featured: true,
  },
  {
    slug: 'ciudad-de-cristal',
    title: 'Ciudad de cristal',
    originalTitle: 'Glass City',
    tagline: 'La ciudad perfecta hides its cracks.',
    synopsis:
      'En una metropoles construida sobre una secrets taboo, un arquitecto descubre que su propia memoria ha sido archivada por la ciudad. Para recuperarla tendra que derrumbarla habitacion a habitacion.',
    releaseDate: '2023-05-19',
    runtimeMinutes: 134,
    ageRating: '12',
    score: 7.9,
    popularity: 91,
    genres: ['ciencia-ficcion', 'drama'],
    videoKey: 'Sintel',
    featured: true,
  },
  {
    slug: 'el-conductor',
    title: 'El conductor',
    originalTitle: 'The Conductor',
    tagline: 'La musica es el unico mapa que queda.',
    synopsis:
      'Un sinfonico pierde la memoria en medio de un gira y empieza a reconocer cada calle por el eco de los edificios. Su obsesion por reconstruir el concierto le revela el secreto que su Tonsuraudio llevaba silenciando.',
    releaseDate: '2022-03-04',
    runtimeMinutes: 121,
    ageRating: '12',
    score: 8.1,
    popularity: 88,
    genres: ['drama', 'musical'],
    videoKey: 'ElephantsDream',
  },
  {
    slug: 'neon-valle',
    title: 'Neon Valle',
    originalTitle: 'Neon Valley',
    tagline: 'Todos los secretos tienen un turno de noche.',
    synopsis:
      'Dos irmãos heredan una gasolinera en un valle que no aparece en ningun mapa. Cada madrugada, clientes de otros tiempos pagan con monedas que no existen y piden cosas que no deberian ser posibles.',
    releaseDate: '2024-02-23',
    runtimeMinutes: 107,
    ageRating: '16',
    score: 7.6,
    popularity: 84,
    genres: ['thriller', 'misterio', 'accion'],
    videoKey: 'ForBiggerBlazes',
    featured: true,
  },
  {
    slug: 'la-sala-de-los-ecos',
    title: 'La sala de los ecos',
    originalTitle: 'Echo Room',
    tagline: 'Todo lo que se dice aqui vuelve con otro nombre.',
    synopsis:
      'Unaadog trainer de peliculas encuentra un almacen lleno de cintas que graban conversaciones que aun no han ocurrido. AlProjectionlas, descubre que el montaje lleva su propia voz desde hace veinticinco años.',
    releaseDate: '2021-09-30',
    runtimeMinutes: 99,
    ageRating: '12',
    score: 7.3,
    popularity: 79,
    genres: ['misterio', 'drama'],
    videoKey: 'ForBiggerEscapes',
  },
  {
    slug: 'carnaval-de-hielo',
    title: 'Carnaval de hielo',
    originalTitle: 'Ice Carnival',
    tagline: 'La fiesta dura una noche. La deuda, no.',
    synopsis:
      'Un grupo de amigos gana una mascara en un carnaval de invierno y descubre que cada vez que uno la usa, pierde un recuerdo. Lo que empiezan a olvidar les cuesta mucho mas que el premio.',
    releaseDate: '2023-12-15',
    runtimeMinutes: 104,
    ageRating: '12',
    score: 7.8,
    popularity: 87,
    genres: ['comedia', 'fantasia' as string, 'familiar'],
    videoKey: 'ForBiggerFun',
  },
  {
    slug: 'el-ultimo-viaje',
    title: 'El ultimo viaje',
    originalTitle: 'Last Ride',
    tagline: 'Ciento veinte kilometros hasta el amanecer.',
    synopsis:
      'Un repartidor acepta el encargo de llevar un paquete sin destino a traves del pais. El camino mas corto lo lleva por personas que llevan veinte años esperando ese mismo paquete.',
    releaseDate: '2022-11-11',
    runtimeMinutes: 112,
    ageRating: '16',
    score: 8.0,
    popularity: 82,
    genres: ['drama', 'aventura'],
    videoKey: 'ForBiggerJoyrides',
  },
  {
    slug: 'rutas-de-fuego',
    title: 'Rutas de fuego',
    originalTitle: 'Burnt Routes',
    tagline: 'El corollary nunca se queda en el mapa.',
    synopsis:
      'Un equipo de rescate de montaña encuentra un bus que no deberia existir en un paso cerrado por la nieve. A bordo, once personas que desaparecieron en exitos distintos relocation.',
    releaseDate: '2024-01-26',
    runtimeMinutes: 126,
    ageRating: '12',
    score: 7.7,
    popularity: 80,
    genres: ['accion', 'aventura', 'drama'],
    videoKey: 'ForBiggerMeltdowns',
  },
  {
    slug: 'el-pais-de-arriba',
    title: 'El pais de arriba',
    originalTitle: 'Upcountry',
    tagline: 'Todo crece aqui. Incluido lo que no devait.',
    synopsis:
      'Una agronoma vuelve al pueblo que la vio crecer y descubre que su padre lleva thirty años cultivando un proyecto que Modifica el clima de la comarca.',
    releaseDate: '2021-04-09',
    runtimeMinutes: 96,
    ageRating: 'TP',
    score: 6.9,
    popularity: 68,
    genres: ['drama', 'familiar'],
    videoKey: 'SubaruOutbackOnStreetAndDirt',
  },
  {
    slug: 'orbita-cero',
    title: 'Orbita cero',
    originalTitle: 'Zero Orbit',
    tagline: 'A mil kilometros de casa, nadie te espera.',
    synopsis:
      'La primera mision tripulada a un planeta sin nombre sale mal en el ultimo segundo. Cuando la nave vuelve a entrar en orbita, su tripulacion ya no recuerda haber salido.',
    releaseDate: '2023-08-22',
    runtimeMinutes: 129,
    ageRating: '12',
    score: 7.5,
    popularity: 85,
    genres: ['ciencia-ficcion', 'aventura'],
    videoKey: 'VolkswagenGTIReview',
    featured: true,
  },
  {
    slug: 'casa-cerca',
    title: 'Casa cerca',
    originalTitle: 'Next Door',
    tagline: 'Tu vecino sabe demasiado y no tiene prisa.',
    synopsis:
      'Una pareja se muda a la casa de sus sueños y descubre que el vecino de al lado lleva una我吗 identificacion igual a la suya, con la misma foto y tres años mas de edad.',
    releaseDate: '2022-06-17',
    runtimeMinutes: 101,
    ageRating: '16',
    score: 7.2,
    popularity: 77,
    genres: ['misterio', 'thriller'],
    videoKey: 'WeAreGoingOnBullrun',
  },
  {
    slug: 'el-sombrero-azul',
    title: 'El sombrero azul',
    originalTitle: 'The Blue Hat',
    tagline: 'Hay Maggie quien solo se recuerda con musica.',
    synopsis:
      'Un músico de NPR pierde la memoria cada vez que toca. Su sobrina, que tambien toca, decide aprender a recordar por los dos antes de que el archivo familiar desaparezca.',
    releaseDate: '2024-08-02',
    runtimeMinutes: 94,
    ageRating: 'TP',
    score: 6.8,
    popularity: 66,
    genres: ['musical', 'familiar', 'drama'],
    videoKey: 'BigBuckBunny',
  },
  {
    slug: 'centro comercial-fin-de-semana',
    title: 'Centro comercial, fin de semana',
    originalTitle: 'Weekend Mall',
    tagline: 'Cuarenta y ocho horas con descuento unlimited.',
    synopsis:
      'Dos amigos sobreviven al turno nocturno de un centro comercial abandonado y descubren que cada tienda es un puerto a un pais distinto.',
    releaseDate: '2021-11-19',
    runtimeMinutes: 88,
    ageRating: 'TP',
    score: 6.6,
    popularity: 71,
    genres: ['comedia', 'fantasia' as string, 'aventura'],
    videoKey: 'WhatCarCanYouGetForAGrand',
  },
  {
    slug: 'testigo-protegido',
    title: 'Testigo protegido',
    originalTitle: 'Protected Witness',
    tagline: 'Lo que viste no cabe en un juicio.',
    synopsis:
      'Un testigo protegido descubre que su nueva identidad tiene un error de fabrication de dos meses. El margen de error lo tiene una organisation que tambien lo sabe.',
    releaseDate: '2023-02-14',
    runtimeMinutes: 117,
    ageRating: '18',
    score: 8.2,
    popularity: 90,
    genres: ['crimen', 'thriller', 'accion'],
    videoKey: 'Sintel',
  },
  {
    slug: 'la-ultima-pelicula',
    title: 'La ultima pelicula',
    originalTitle: 'The Last Movie',
    tagline: 'Cuando se apagan las luces, queda el cine.',
    synopsis:
      'El ultimo proyeccionista de un cine que cierra en demolition discovers que la ultima pelicula que proyectara es una Grabacion de su propia vida, aun no vivida.',
    releaseDate: '2024-10-31',
    runtimeMinutes: 109,
    ageRating: '16',
    score: 8.6,
    popularity: 94,
    genres: ['drama', 'misterio', 'fantasia' as string],
    videoKey: 'ElephantsDream',
    featured: true,
  },
  {
    slug: 'la-venta-del-century',
    title: 'La venta del century',
    originalTitle: 'Century Sale',
    tagline: 'Todo tiene precio. Excepto tu nombre.',
    synopsis:
      'Una subasta de objetos que fueron propiedad de gente famosa termina mal cuando aparece un lote que pertenece a un comprador futuro. Quien lo gana, hereda una deuda de noventa años.',
    releaseDate: '2022-05-20',
    runtimeMinutes: 102,
    ageRating: '12',
    score: 7.1,
    popularity: 74,
    genres: ['comedia', 'crimen'],
    videoKey: 'ForBiggerJoyrides',
  },
  {
    slug: 'invierno-en-el-eden',
    title: 'Invierno en el eden',
    originalTitle: 'Winter in Eden',
    tagline: 'La nieve cubre lo que nadie recuerda.',
    synopsis:
      'Un pueblo de montaña aparece Covered de nieve en pleno verano. SusCERTIFYPAYaxe únicos窓口 uno a uno y la arqueologa que llega a(documentar)lo descubre demasiado tarde.',
    releaseDate: '2021-01-28',
    runtimeMinutes: 105,
    ageRating: 'TP',
    score: 6.4,
    popularity: 62,
    genres: ['misterio', 'familiar', 'drama'],
    videoKey: 'TearsOfSteel',
  },
  {
    slug: 'ruleta-rusa',
    title: 'Ruleta rusa',
    originalTitle: 'Russian Roulette',
    tagline: 'El juego empieza cuando alguien se niega.',
    synopsis:
      'Un grupo de amigos ijuegan cada noche a un juego de mesa donde la apuesta es una verdad. Una noche, la verdad que se decide callar cambia el juego para siempre.',
    releaseDate: '2023-09-01',
    runtimeMinutes: 98,
    ageRating: '18',
    score: 7.4,
    popularity: 83,
    genres: ['thriller', 'drama'],
    videoKey: 'ForBiggerMeltdowns',
  },
  {
    slug: 'atlas-de-polvo',
    title: 'Atlas de polvo',
    originalTitle: 'Dust Atlas',
    tagline: 'Todo lo que desaparece, acaba en un mapa.',
    synopsis:
      'Un cartógrafo Municipal empieza a dibujar los edificios que la ciudad demuele y descubre que sus planos describen un futuro que nadie quiere habitar.',
    releaseDate: '2024-03-15',
    runtimeMinutes: 113,
    ageRating: '12',
    score: 7.9,
    popularity: 76,
    genres: ['drama', 'misterio', 'ciencia-ficcion'],
    videoKey: 'SubaruOutbackOnStreetAndDirt',
  },
  {
    slug: 'la-cocina-de-los-fuegos',
    title: 'La cocina de los fuegos',
    originalTitle: 'Kitchen of Fires',
    tagline: 'Todo se cocina a fuego lento. Tambien las与众.',
    synopsis:
      'Una chef pierde el gusto y vuelve a su pueblo para开放的 cocina familiar, donde descubre que la Secret sauce que.End conserva un error que lleva geraçõesMaintaining.',
    releaseDate: '2022-09-09',
    runtimeMinutes: 111,
    ageRating: '12',
    score: 7.0,
    popularity: 70,
    genres: ['drama', 'comedia', 'familiar'],
    videoKey: 'BigBuckBunny',
  },
  {
    slug: 'bitcoin-family',
    title: 'FamiliaBits',
    originalTitle: 'Bits Family',
    tagline: 'El dinero ya no existe. Solo el tiempo.',
    synopsis:
      'Una familia entera acumula BTC durante años y descubre que ha estado regalando su patrimonio al vecino de al lado, byte a byte, durante dos décadas.',
    releaseDate: '2021-06-11',
    runtimeMinutes: 91,
    ageRating: 'TP',
    score: 6.5,
    popularity: 64,
    genres: ['comedia', 'familiar'],
    videoKey: 'WeAreGoingOnBullrun',
  },
  {
    slug: 'la-frontera-invisible',
    title: 'La frontera invisible',
    originalTitle: 'Invisible Border',
    tagline: 'Las周一 líneas que nadie negocia.',
    synopsis:
      'Una画出 mapas que cambia cuando cierras los ojos descubre una frontera que separa dos versiones del mismo barrio, y un niMAO que vive en el medio.',
    releaseDate: '2023-04-05',
    runtimeMinutes: 122,
    ageRating: '16',
    score: 8.3,
    popularity: 89,
    genres: ['ciencia-ficcion', 'drama', 'fantasia' as string],
    videoKey: 'VolkswagenGTIReview',
    featured: true,
  },
  {
    slug: 'domingo-sin-gafas',
    title: 'Domingo sin gafas',
    originalTitle: 'Sunday Without Glasses',
    tagline: 'Cuando dejas de ver bien, empiezas a ver de verdad.',
    synopsis:
      'Un restaurador de Spike just cuando ya no distingue los detalles se ve obligado a reconstruir cada plato desde los recuerdos de sus clientes.',
    releaseDate: '2024-05-30',
    runtimeMinutes: 86,
    ageRating: 'TP',
    score: 6.7,
    popularity: 69,
    genres: ['drama', 'romance'],
    videoKey: 'WhatCarCanYouGetForAGrand',
  },
];

export function remoteUrlFor(videoKey: string): string {
  return `${SAMPLE_BASE}/${videoKey}.mp4`;
}