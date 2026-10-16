/**
 * Catalogo de demostracion.
 * Los videos son clips de relleno de dominio publico (Blender Foundation y
 * W3C/MDN) que admiten peticiones Range, asi el player puede hacer streaming
 * real. Para produccion basta con cambiar `videoUrl` por tu CDN o copiar tus
 * archivos en VIDEOS_DIR y usar `videoSource: 'local'`.
 */
const CLIP_SOURCES: Record<string, string> = {
  bigbuckbunny:
    'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
  sintel: 'https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_1MB.mp4',
  jellyfish: 'https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4',
  flower: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  friday: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4',
};

/** Reparte los clips de relleno entre las peliculas del catalogo. */
const CLIP_ALIASES: Record<string, keyof typeof CLIP_SOURCES> = {
  BigBuckBunny: 'bigbuckbunny',
  ElephantsDream: 'bigbuckbunny',
  WhatCarCanYouGetForAGrand: 'bigbuckbunny',

  Sintel: 'sintel',
  TearsOfSteel: 'sintel',
  ForBiggerMeltdowns: 'sintel',

  VolkswagenGTIReview: 'jellyfish',
  ForBiggerFun: 'jellyfish',

  SubaruOutbackOnStreetAndDirt: 'flower',
  ForBiggerEscapes: 'flower',

  WeAreGoingOnBullrun: 'friday',
  ForBiggerBlazes: 'friday',
  ForBiggerJoyrides: 'friday',
};

export function remoteUrlFor(videoKey: string): string {
  const direct = CLIP_SOURCES[videoKey];
  if (direct) return direct;

  const alias = CLIP_ALIASES[videoKey];
  const url = alias ? CLIP_SOURCES[alias] : CLIP_SOURCES.bigbuckbunny;
  if (!url) throw new Error(`No hay clip de relleno para "${videoKey}"`);
  return url;
}

export type SeedRole = 'admin' | 'editor' | 'user';

export interface SeedUser {
  email: string;
  displayName: string;
  password: string;
  role: SeedRole;
}

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
  videoKey: string;
  featured?: boolean;
}

export const GENRES: SeedGenre[] = [
  { name: 'Accion', slug: 'accion' },
  { name: 'Animacion', slug: 'animacion' },
  { name: 'Aventura', slug: 'aventura' },
  { name: 'Ciencia ficcion', slug: 'ciencia-ficcion' },
  { name: 'Comedia', slug: 'comedia' },
  { name: 'Crimen', slug: 'crimen' },
  { name: 'Documental', slug: 'documental' },
  { name: 'Drama', slug: 'drama' },
  { name: 'Familiar', slug: 'familiar' },
  { name: 'Fantasia', slug: 'fantasia' },
  { name: 'Musical', slug: 'musical' },
  { name: 'Misterio', slug: 'misterio' },
  { name: 'Romance', slug: 'romance' },
  { name: 'Terror', slug: 'terror' },
  { name: 'Thriller', slug: 'thriller' },
];

export const USERS: SeedUser[] = [
  {
    email: 'admin@pelipop.dev',
    displayName: 'Administracion',
    password: 'admin12345',
    role: 'admin',
  },
  {
    email: 'editor@pelipop.dev',
    displayName: 'Equipo de catalogo',
    password: 'editor12345',
    role: 'editor',
  },
  {
    email: 'cliente@pelipop.dev',
    displayName: 'Cliente demo',
    password: 'cliente12345',
    role: 'user',
  },
];

export const MOVIES: SeedMovie[] = [
  {
    slug: 'la-ultima-senal',
    title: 'La ultima senal',
    originalTitle: 'The Last Signal',
    tagline: 'Cuando la radio se calla, alguien sigue escuchando.',
    synopsis:
      'Una ingeniera de telecomunicaciones detecta una emision imposible en una frecuencia prohibida. La senal reune cada noche a un grupo de insomnes que lleva veinte anos buscando a su emisor, y a cambio les devuelve un minuto del mismo dia que no logran recordar.',
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
    tagline: 'La ciudad perfecta tambien tiene grietas.',
    synopsis:
      'En una metropoles construida sobre un secreto compartido, un arquitecto descubre que la propia ciudad archiva los recuerdos de sus habitantes. Para volver a los suyos tendra que desmontarla habitacion por habitacion.',
    releaseDate: '2023-05-19',
    runtimeMinutes: 134,
    ageRating: '12',
    score: 7.9,
    popularity: 91,
    genres: ['ciencia-ficcion', 'drama'],
    videoKey: 'Sintel',
  },
  {
    slug: 'el-director-de-orquesta',
    title: 'El director de orquesta',
    originalTitle: 'The Conductor',
    tagline: 'La musica es el unico mapa que queda.',
    synopsis:
      'Un director de orquesta pierde la memoria en mitad de una gira y empieza a reconocer cada ciudad por el eco de sus edificios. Reconstruir el concierto que nunca llego a estrenar le revela el secreto que su propia orquesta llevaba silenciando.',
    releaseDate: '2022-03-04',
    runtimeMinutes: 121,
    ageRating: '12',
    score: 8.1,
    popularity: 88,
    genres: ['drama', 'musical'],
    videoKey: 'ElephantsDream',
  },
  {
    slug: 'valle-neon',
    title: 'Valle neon',
    originalTitle: 'Neon Valley',
    tagline: 'Todos los secretos tienen turno de noche.',
    synopsis:
      'Dos hermanos heredan una gasolinera en un valle que no aparece en ningun mapa. Cada madrugada aparecen clientes de otros tiempos que pagan con monedas inexistentes y piden cosas que no deberian ser posibles.',
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
      'Una montadora de peliculas encuentra un almacen lleno de cintas que graban conversaciones que aun no han ocurrido. Al reproducirlas descubre que la ultima cinta lleva veinticinco anos de voz propia.',
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
      'Un grupo de amigos gana una mascara en un carnaval de invierno y descubre que cada vez que alguien se la pone, pierde un recuerdo. Lo que empiezan a olvidar les cuesta mucho mas que el premio.',
    releaseDate: '2023-12-15',
    runtimeMinutes: 104,
    ageRating: '12',
    score: 7.8,
    popularity: 87,
    genres: ['comedia', 'fantasia', 'familiar'],
    videoKey: 'ForBiggerFun',
  },
  {
    slug: 'el-ultimo-viaje',
    title: 'El ultimo viaje',
    originalTitle: 'Last Ride',
    tagline: 'Ciento veinte kilometros hasta el amanecer.',
    synopsis:
      'Un repartidor acepta llevar un paquete sin destino a traves del pais. El camino mas corto lo lleva delante de personas que llevan veinte anos esperando exactamente ese envio.',
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
    tagline: 'La carretera nunca se queda en el mapa.',
    synopsis:
      'Un equipo de rescate de montana encuentra un autobus que no deberia existir en un paso cerrado por la nieve. A bordo, once personas que desaparecieron en fechas distintas, todas a la misma hora.',
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
    tagline: 'Todo crece aqui. Tambien lo que no deberia.',
    synopsis:
      'Una agronoma vuelve al pueblo que la vio crecer y descubre que su padre lleva treinta anos cultivando un proyecto que altera el clima de la comarca entera.',
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
      'La primera mision tripulada hacia un planeta sin nombre falla en el ultimo segundo. Cuando la nave vuelve a entrar en orbita, su tripulacion ya no recuerda haber salido.',
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
    slug: 'la-casa-de-al-lado',
    title: 'La casa de al lado',
    originalTitle: 'Next Door',
    tagline: 'Tu vecino sabe demasiado y no tiene prisa.',
    synopsis:
      'Una pareja se muda a la casa de sus suenos y descubre que el vecino de al lado guarda una identificacion identica a la suya, con la misma fotografia y tres anos mas.',
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
    tagline: 'Hay personas que solo se recuerdan con musica.',
    synopsis:
      'Un musico callejero pierde la memoria cada vez que toca. Su sobrina, que tambien toca, decide aprender a recordar por los dos antes de que el archivo familiar desaparezca del todo.',
    releaseDate: '2024-08-02',
    runtimeMinutes: 94,
    ageRating: 'TP',
    score: 6.8,
    popularity: 66,
    genres: ['musical', 'familiar', 'drama'],
    videoKey: 'BigBuckBunny',
  },
  {
    slug: 'centro-comercial-fin-de-semana',
    title: 'Centro comercial, fin de semana',
    originalTitle: 'Weekend Mall',
    tagline: 'Cuarenta y ocho horas con descuento infinito.',
    synopsis:
      'Dos amigos sobreviven al turno nocturno de un centro comercial recien cerrado y descubren que cada tienda es la puerta a un pais distinto.',
    releaseDate: '2021-11-19',
    runtimeMinutes: 88,
    ageRating: 'TP',
    score: 6.6,
    popularity: 71,
    genres: ['comedia', 'fantasia', 'aventura'],
    videoKey: 'WhatCarCanYouGetForAGrand',
  },
  {
    slug: 'testigo-protegido',
    title: 'Testigo protegido',
    originalTitle: 'Protected Witness',
    tagline: 'Lo que viste no cabe en un juicio.',
    synopsis:
      'Un testigo protegido descubre que su nueva identidad tiene un error de fabricacion de dos meses. Ese margen de error lo conoce una organizacion que tambien esta buscandolo.',
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
      'El ultimo proyeccionista de un cine amenazado de derribo descubre que la funcion de cierre sera la grabacion de su propia vida, todavia no vivida.',
    releaseDate: '2024-10-31',
    runtimeMinutes: 109,
    ageRating: '16',
    score: 8.6,
    popularity: 94,
    genres: ['drama', 'misterio', 'fantasia'],
    videoKey: 'ElephantsDream',
    featured: true,
  },
  {
    slug: 'la-venta-del-siglo',
    title: 'La venta del siglo',
    originalTitle: 'Century Sale',
    tagline: 'Todo tiene precio. Excepto tu nombre.',
    synopsis:
      'Una subasta de objetos que fueron propiedad de gente famosa se tuerce cuando aparece un lote cuyo comprador es una persona que aun no ha nacido. Quien lo gane hereda una deuda de noventa anos.',
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
      'Un pueblo de montania aparece cubierto de nieve en pleno verano. Sus habitantes desaparecen uno a uno y la arqueologa enviada a documentarlo se da cuenta demasiado tarde.',
    releaseDate: '2021-01-28',
    runtimeMinutes: 105,
    ageRating: 'TP',
    score: 6.4,
    popularity: 62,
    genres: ['misterio', 'familiar', 'drama'],
    videoKey: 'TearsOfSteel',
  },
  {
    slug: 'la-verdad-una-vez',
    title: 'La verdad, una vez',
    originalTitle: 'One Truth',
    tagline: 'El juego empieza cuando alguien se niega.',
    synopsis:
      'Cuatro amigos juegan cada noche a un juego de mesa cuya unica apuesta es una verdad. Una noche, la verdad que deciden callar cambia el juego para siempre.',
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
    tagline: 'Todo lo que desaparece acaba en un mapa.',
    synopsis:
      'Un cartografo municipal empieza a dibujar los edificios que la ciudad derriba y descubre que sus planos describen un futuro que nadie quiere habitar.',
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
    tagline: 'Todo se cocina a fuego lento. Tambien los rencores.',
    synopsis:
      'Una chef pierde el gusto y vuelve a su pueblo para reabrir la cocina familiar, donde descubre que la salsa secreta de la casa oculta un error que se arrastra desde hace generaciones.',
    releaseDate: '2022-09-09',
    runtimeMinutes: 111,
    ageRating: '12',
    score: 7.0,
    popularity: 70,
    genres: ['drama', 'comedia', 'familiar'],
    videoKey: 'BigBuckBunny',
  },
  {
    slug: 'familia-bits',
    title: 'Familia Bits',
    originalTitle: 'Bits Family',
    tagline: 'El dinero ya no existe. Solo el tiempo.',
    synopsis:
      'Una familia junta criptomonedas durante veinte anos y descubre que buena parte de su patrimonio se ha ido desvaneciendo, byte a byte, por una cuenta que nadie recuerda abrir.',
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
    tagline: 'Hay lineas que nadie negocia.',
    synopsis:
      'Una cartografa de oficio dibuja mapas que cambian cuando cierra los ojos. Al fijarse en el detalle, encuentra una frontera que separa dos versiones del mismo barrio y un nino que vive en el medio.',
    releaseDate: '2023-04-05',
    runtimeMinutes: 122,
    ageRating: '16',
    score: 8.3,
    popularity: 89,
    genres: ['ciencia-ficcion', 'drama', 'fantasia'],
    videoKey: 'VolkswagenGTIReview',
    featured: true,
  },
  {
    slug: 'domingo-sin-gafas',
    title: 'Domingo sin gafas',
    originalTitle: 'Sunday Without Glasses',
    tagline: 'Cuando dejas de ver bien, empiezas a ver de verdad.',
    synopsis:
      'Un restaurador de pintura pierde la vista justo cuando mas le importan los detalles. Tendra que reconstruir cada obra desde lo que sus clientes le cuentan.',
    releaseDate: '2024-05-30',
    runtimeMinutes: 86,
    ageRating: 'TP',
    score: 6.7,
    popularity: 69,
    genres: ['drama', 'romance'],
    videoKey: 'WhatCarCanYouGetForAGrand',
  },
  {
    slug: 'la-cabana-roja',
    title: 'La cabana roja',
    originalTitle: 'The Red Cottage',
    tagline: 'Toda familia tiene una habitacion que no se abre.',
    synopsis:
      'Una familia se instala en una casa heredada y encuentra la puerta de una habitacion clavada. Lo que hay detras es el mismo suceso visto cinco veces desde cinco puntos de vista distintos.',
    releaseDate: '2022-02-11',
    runtimeMinutes: 114,
    ageRating: '16',
    score: 7.8,
    popularity: 75,
    genres: ['terror', 'misterio', 'drama'],
    videoKey: 'ForBiggerEscapes',
  },
  {
    slug: 'manual-de-escape',
    title: 'Manual de escape',
    originalTitle: 'Escape Manual',
    tagline: 'Nadie te enseña a salir. Solo a quedarte.',
    synopsis:
      'Un profesor de supervivencia urbana imparte un curso para salir de cualquier sitio. Cuando alguien lo usa para no volver a su casa, descubre que el problema no era la habitacion.',
    releaseDate: '2024-04-19',
    runtimeMinutes: 103,
    ageRating: '12',
    score: 7.2,
    popularity: 73,
    genres: ['thriller', 'drama', 'misterio'],
    videoKey: 'ForBiggerFun',
  },
];