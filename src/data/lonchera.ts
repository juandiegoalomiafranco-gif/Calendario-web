import type { ScenarioCode } from './nutrition'

/**
 * Qué llevar al colegio, con gramos.
 *
 * Contexto real: Juan Diego lleva lonchera y come dos veces en el colegio — la media
 * mañana en el recreo (10:05-10:28) y el almuerzo en el bloque de almuerzo
 * (13:20-14:05). Los miércoles salen a la 1:00 pm y solo hay un recreo, así que ese
 * día la lonchera es una sola y más completa, y el almuerzo de verdad es en casa.
 *
 * Reglas que cumple todo lo de aquí:
 *  - se prepara en la casa la noche anterior o esa mañana,
 *  - viaja bien en una lonchera (nada que se deshaga ni que huela),
 *  - se come frío o del tiempo, sin necesidad de microondas,
 *  - trae proteína en todas las franjas, que es lo que sostiene el entreno.
 *
 * Las cantidades cambian según el escenario del día (E1 gym, E2 doble sesión,
 * E3 fondo largo, E4 descanso), porque no come lo mismo un día de descanso que uno
 * de doble sesión.
 */

/** Una cantidad fija, o una distinta según el escenario del día. */
export type Cantidad = string | Partial<Record<ScenarioCode, string>>

export interface LoncheraItem {
  alimento: string
  cantidad: Cantidad
  /** Cómo se prepara o se empaca, cuando no es evidente. */
  tip?: string
}

export interface LoncheraOpcion {
  id: string
  nombre: string
  items: LoncheraItem[]
  /** Aproximado, para el escenario E1. Sirve para comparar opciones entre sí. */
  kcal: number
  proteinaG: number
  prep: string
}

export type Franja = 'recreo' | 'almuerzo' | 'miercoles'

export function cantidadPara(c: Cantidad, escenario: ScenarioCode): string {
  return typeof c === 'string' ? c : (c[escenario] ?? c.E1 ?? '—')
}

// --- Media mañana (recreo, 10:05-10:28) -------------------------------------

const RECREO: LoncheraOpcion[] = [
  {
    id: 'recreo-yogur',
    nombre: 'Yogur griego con fruta y nueces',
    kcal: 290,
    proteinaG: 22,
    prep: 'Todo en un frasco con tapa la noche anterior. Las nueces aparte para que no se ablanden.',
    items: [
      {
        alimento: 'Yogur griego sin azúcar',
        cantidad: { E1: '150 g', E2: '200 g', E3: '200 g', E4: '125 g' },
      },
      {
        alimento: 'Fresas o moras',
        cantidad: { E1: '80 g', E2: '100 g', E3: '120 g', E4: '75 g' },
      },
      { alimento: 'Nueces o almendras', cantidad: { E1: '15 g', E2: '20 g', E3: '20 g', E4: '12 g' } },
      { alimento: 'Avena en hojuelas', cantidad: { E1: '20 g', E2: '30 g', E3: '40 g', E4: '0 g' } },
    ],
  },
  {
    id: 'recreo-sandwich',
    nombre: 'Sándwich de pavo y queso',
    kcal: 330,
    proteinaG: 24,
    prep: 'Pan integral, pavo, queso y lechuga. Envuelto en papel, no en bolsa: no se aguada.',
    items: [
      {
        alimento: 'Pan integral',
        cantidad: { E1: '2 tajadas (60 g)', E2: '2 tajadas (60 g)', E3: '3 tajadas (90 g)', E4: '1 tajada (30 g)' },
      },
      { alimento: 'Pavo o pollo desmechado', cantidad: { E1: '60 g', E2: '80 g', E3: '80 g', E4: '50 g' } },
      { alimento: 'Queso campesino bajo en grasa', cantidad: '30 g' },
      { alimento: 'Lechuga y tomate', cantidad: '40 g', tip: 'El tomate aparte si lo empacas la noche anterior.' },
      { alimento: 'Mandarina o manzana', cantidad: '1 unidad (120 g)' },
    ],
  },
  {
    id: 'recreo-huevos',
    nombre: 'Huevos duros con arepa',
    kcal: 310,
    proteinaG: 21,
    prep: 'Los huevos se cocinan la noche anterior y viajan con cáscara. La arepa, asada sin aceite.',
    items: [
      { alimento: 'Huevos duros', cantidad: { E1: '2 u (100 g)', E2: '3 u (150 g)', E3: '2 u (100 g)', E4: '2 u (100 g)' } },
      {
        alimento: 'Arepa pequeña de maíz',
        cantidad: { E1: '1 u (60 g)', E2: '1 u (60 g)', E3: '2 u (120 g)', E4: '½ u (30 g)' },
      },
      { alimento: 'Queso fresco', cantidad: '25 g' },
      { alimento: 'Banano', cantidad: { E1: '½ u (60 g)', E2: '1 u (120 g)', E3: '1 u (120 g)', E4: '½ u (60 g)' } },
    ],
  },
  {
    id: 'recreo-batido',
    nombre: 'Batido de proteína y avena',
    kcal: 340,
    proteinaG: 30,
    prep: 'Se licúa en la mañana y va en termo. Es la opción de los días de afán.',
    items: [
      { alimento: 'Proteína en polvo (Savvy o whey)', cantidad: { E1: '25 g (1 scoop)', E2: '30 g', E3: '25 g', E4: '20 g' } },
      { alimento: 'Leche descremada o bebida de almendras', cantidad: '250 ml' },
      { alimento: 'Avena en hojuelas', cantidad: { E1: '30 g', E2: '40 g', E3: '50 g', E4: '20 g' } },
      { alimento: 'Banano', cantidad: '1 u (120 g)' },
      { alimento: 'Mantequilla de maní', cantidad: { E1: '10 g', E2: '15 g', E3: '15 g', E4: '0 g' } },
    ],
  },
]

// --- Almuerzo en lonchera (13:20-14:05) -------------------------------------

const ALMUERZO: LoncheraOpcion[] = [
  {
    id: 'almuerzo-pollo-arroz',
    nombre: 'Pollo con arroz integral y verduras',
    kcal: 620,
    proteinaG: 45,
    prep: 'Se hace la noche anterior. En recipiente hermético; se come del tiempo sin problema.',
    items: [
      {
        alimento: 'Pechuga de pollo a la plancha',
        cantidad: { E1: '140 g', E2: '170 g', E3: '150 g', E4: '120 g' },
        tip: 'Cortada en tiras: se come más fácil sin cuchillo.',
      },
      {
        alimento: 'Arroz integral cocido',
        cantidad: { E1: '150 g', E2: '200 g', E3: '230 g', E4: '100 g' },
      },
      { alimento: 'Brócoli y zanahoria al vapor', cantidad: '150 g' },
      { alimento: 'Aguacate', cantidad: { E1: '40 g', E2: '50 g', E3: '40 g', E4: '30 g' }, tip: 'Con limón encima para que no se oscurezca.' },
      { alimento: 'Aceite de oliva', cantidad: '5 ml' },
    ],
  },
  {
    id: 'almuerzo-pasta-atun',
    nombre: 'Pasta fría con atún',
    kcal: 590,
    proteinaG: 42,
    prep: 'Ensalada de pasta: se hace en 15 minutos y sabe mejor fría que caliente.',
    items: [
      {
        alimento: 'Pasta integral cocida',
        cantidad: { E1: '160 g', E2: '200 g', E3: '240 g', E4: '110 g' },
      },
      { alimento: 'Atún en agua escurrido', cantidad: { E1: '120 g', E2: '150 g', E3: '120 g', E4: '100 g' } },
      { alimento: 'Tomate cherry y pepino', cantidad: '120 g' },
      { alimento: 'Maíz tierno', cantidad: '50 g' },
      { alimento: 'Aceite de oliva y limón', cantidad: '10 ml' },
    ],
  },
  {
    id: 'almuerzo-wrap',
    nombre: 'Wrap de carne magra y frijol',
    kcal: 640,
    proteinaG: 44,
    prep: 'Se arma y se envuelve en papel aluminio. Aguanta perfecto hasta la hora del almuerzo.',
    items: [
      {
        alimento: 'Tortilla integral grande',
        cantidad: { E1: '2 u (100 g)', E2: '2 u (100 g)', E3: '3 u (150 g)', E4: '1 u (50 g)' },
      },
      { alimento: 'Carne magra molida o desmechada', cantidad: { E1: '130 g', E2: '160 g', E3: '140 g', E4: '110 g' } },
      { alimento: 'Frijol cocido', cantidad: { E1: '80 g', E2: '110 g', E3: '130 g', E4: '60 g' } },
      { alimento: 'Lechuga, tomate y cebolla', cantidad: '80 g' },
      { alimento: 'Queso rallado bajo en grasa', cantidad: '25 g' },
    ],
  },
  {
    id: 'almuerzo-quinua',
    nombre: 'Bowl de quinua con huevo y garbanzo',
    kcal: 600,
    proteinaG: 38,
    prep: 'La quinua y el garbanzo rinden para dos días. Los huevos, duros, se pelan allá.',
    items: [
      {
        alimento: 'Quinua cocida',
        cantidad: { E1: '150 g', E2: '190 g', E3: '220 g', E4: '110 g' },
      },
      { alimento: 'Garbanzo cocido', cantidad: { E1: '100 g', E2: '120 g', E3: '120 g', E4: '80 g' } },
      { alimento: 'Huevos duros', cantidad: { E1: '2 u (100 g)', E2: '3 u (150 g)', E3: '2 u (100 g)', E4: '2 u (100 g)' } },
      { alimento: 'Espinaca y tomate', cantidad: '100 g' },
      { alimento: 'Aguacate', cantidad: '40 g' },
    ],
  },
]

// --- Miércoles: salida 1:00 pm, un solo recreo ------------------------------

const MIERCOLES: LoncheraOpcion[] = [
  {
    id: 'mie-wrap-doble',
    nombre: 'Wrap de pollo reforzado',
    kcal: 480,
    proteinaG: 35,
    prep: 'El miércoles solo hay un recreo y sales a la 1:00 pm: esta lonchera tiene que aguantar hasta el almuerzo en la casa.',
    items: [
      { alimento: 'Tortilla integral', cantidad: '2 u (100 g)' },
      { alimento: 'Pollo desmechado', cantidad: { E1: '110 g', E2: '130 g', E3: '120 g', E4: '90 g' } },
      { alimento: 'Queso campesino', cantidad: '30 g' },
      { alimento: 'Lechuga y tomate', cantidad: '60 g' },
      { alimento: 'Mandarina', cantidad: '1 u (120 g)' },
    ],
  },
  {
    id: 'mie-yogur-sandwich',
    nombre: 'Yogur grande + medio sándwich',
    kcal: 450,
    proteinaG: 32,
    prep: 'Dos cosas pequeñas en vez de una grande: se come en los 20 minutos del recreo sin afán.',
    items: [
      { alimento: 'Yogur griego sin azúcar', cantidad: '200 g' },
      { alimento: 'Granola sin azúcar', cantidad: { E1: '30 g', E2: '40 g', E3: '45 g', E4: '20 g' } },
      { alimento: 'Pan integral', cantidad: '1 tajada (30 g)' },
      { alimento: 'Pavo', cantidad: '50 g' },
      { alimento: 'Almendras', cantidad: '15 g' },
    ],
  },
  {
    id: 'mie-huevos-arepa',
    nombre: 'Arepa rellena de huevo y queso',
    kcal: 470,
    proteinaG: 30,
    prep: 'Se arma la noche anterior y se calienta 2 minutos en la mañana. Va envuelta en papel.',
    items: [
      { alimento: 'Arepa de maíz', cantidad: { E1: '1 u (80 g)', E2: '1 u (80 g)', E3: '2 u (160 g)', E4: '1 u (60 g)' } },
      { alimento: 'Huevos revueltos', cantidad: '2 u (100 g)' },
      { alimento: 'Queso fresco', cantidad: '40 g' },
      { alimento: 'Banano', cantidad: '1 u (120 g)' },
    ],
  },
]

export const LONCHERA: Record<Franja, LoncheraOpcion[]> = {
  recreo: RECREO,
  almuerzo: ALMUERZO,
  miercoles: MIERCOLES,
}

export const FRANJA_META: Record<Franja, { titulo: string; hora: string; nota: string }> = {
  recreo: {
    titulo: 'Media mañana (recreo)',
    hora: '10:05 – 10:28',
    nota: 'Son 23 minutos: algo que se coma rápido y de una sola mano.',
  },
  almuerzo: {
    titulo: 'Almuerzo en lonchera',
    hora: '13:20 – 14:05',
    nota: 'Se come del tiempo, sin microondas. En recipiente hermético.',
  },
  miercoles: {
    titulo: 'Miércoles — recreo reforzado',
    hora: '10:25 – 10:45',
    nota: 'Salen a la 1:00 pm, así que hoy el almuerzo de verdad es en la casa.',
  },
}

/** Qué franjas hay que empacar ese día. */
export function franjasDelDia(tipoDeDia: string): Franja[] {
  return tipoDeDia === 'miercoles' ? ['miercoles'] : ['recreo', 'almuerzo']
}
