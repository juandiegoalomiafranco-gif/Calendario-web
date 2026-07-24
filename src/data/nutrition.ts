// Dieta por escenarios de Diego (Julio 2026). Datos de referencia estáticos (como
// plan.ts / schoolTimetable.ts). El escenario del día se elige con la carga de entreno
// (ver src/lib/nutrition.ts); lo que va por usuario a Supabase es solo el registro de
// comidas cumplidas (useNutritionLog).

export type ScenarioCode = 'E1' | 'E2' | 'E3' | 'E4'

export interface DietFood {
  alimento: string
  cantidad: string
  medida: string
  sustitutos: string[]
}

export interface DietMeal {
  id: string // clave estable para marcar cumplido (p. ej. 'E1-desayuno')
  franja: string
  note?: string
  foods: DietFood[]
}

export interface DietScenario {
  code: ScenarioCode
  name: string
  subtitle: string
  kcal: number
  carbsG: number
  triggerRule: string
  hydration: string
  atomix: string
  creatina: string
  color: string
  meals: DietMeal[]
}

// Helper para declarar alimentos de forma compacta.
const f = (alimento: string, cantidad: string, medida: string, ...sustitutos: string[]): DietFood => ({
  alimento,
  cantidad,
  medida,
  sustitutos,
})

const E1: DietScenario = {
  code: 'E1',
  name: 'Día de Gym',
  subtitle: 'Gym en la tarde',
  kcal: 1850,
  carbsG: 150,
  triggerRule: 'Gym/funcional o rodaje suave',
  hydration: 'Agua: 2,5-3 L en el día.',
  atomix: 'Atomix SOLO después del gym si sudó mucho o hizo calor (5-10 g en 500 ml). En sesión normal, agua simple.',
  creatina: 'Creatina 3-5 g en el batido post-entreno.',
  color: 'bg-brand-500',
  meals: [
    {
      id: 'E1-desayuno',
      franja: 'Desayuno',
      foods: [
        f('Huevos enteros', '2 u (100 g)', '2 unidades', '4 claras', 'Tofu firme 150 g', 'Atún en agua 60 g'),
        f('Claras de huevo', '3 u (105 g)', '3 claras', '1 huevo entero', 'Yogur griego 100 g', 'Pavo natural 40 g'),
        f('Arepa pequeña', '40 g', '1 arepa / palma', 'Pan integral 40 g', 'Avena cruda 25 g', 'Tortilla integral 1 u'),
        f('Queso fresco bajo en grasa', '20 g', '1 cubo / rebanada', 'Queso panela 20 g', 'Requesón 40 g', 'Cottage 40 g'),
        f('Banano', '½ u (50 g)', '½ unidad', 'Manzana ½', 'Papaya 100 g', 'Fresas ½ taza'),
      ],
    },
    {
      id: 'E1-media-manana',
      franja: 'Media mañana',
      foods: [
        f('Yogur griego sin azúcar', '125 g', '½ taza / 1 pote', 'Kumis sin azúcar 125 g', 'Leche descremada 200 ml', 'Cottage 100 g'),
        f('Moras', '½ taza (75 g)', '½ taza', 'Arándanos ¼ taza', 'Fresas ½ taza', 'Kiwi 1 u'),
        f('Almendras', '10 u (12 g)', '1 puñado pequeño', 'Nueces 6 u', 'Maní sin sal 12 g', 'Semillas de calabaza 1 cda'),
      ],
    },
    {
      id: 'E1-almuerzo',
      franja: 'Almuerzo',
      foods: [
        f('Pollo pechuga a la plancha', '120 g', '1 palma de la mano', 'Pescado (tilapia) 120 g', 'Carne magra 120 g', 'Lomo de cerdo magro 120 g'),
        f('Arroz integral cocido', '100 g', '½ taza / 1 puño', 'Papa cocida 120 g', 'Pasta integral 60 g', 'Quinua cocida 100 g'),
        f('Ensalada mixta', '150 g', '2 puños / plato', 'Brócoli 150 g', 'Espinaca 150 g', 'Calabacín 150 g'),
        f('Aguacate', '25 g', '2 cucharadas', 'Aceite de oliva 1 cdta', 'Aceitunas 6 u', 'Semillas de girasol 1 cda'),
        f('Fruta pequeña', '80 g', '1 unidad', 'Pera 1 u', 'Mandarina 2 u', 'Durazno 1 u'),
      ],
    },
    {
      id: 'E1-pre-entreno',
      franja: 'Pre-entreno (30-45 min antes del gym)',
      foods: [
        f('Pan integral', '40 g', '2 tajadas', 'Arepa pequeña 40 g', 'Tostada integral 2 u', 'Avena 25 g'),
        f('Mermelada sin azúcar', '10 g', '1 cucharada', 'Miel 1 cdta', 'Banano en rodajas ½', 'Fruta picada 50 g'),
        f('Claras de huevo cocidas', '2 u', '2 claras', 'Yogur natural 100 g', 'Pavo natural 40 g', '1 huevo duro'),
      ],
    },
    {
      id: 'E1-post-entreno',
      franja: 'Post-entreno (inmediato)',
      foods: [
        f('Batido de proteína Savvy', '25 g', '1 scoop', 'Whey 1 scoop', 'Yogur griego 200 g', 'Proteína de comida 30 g'),
        f('Creatina monohidratada', '3-5 g', '1 cucharadita (en el batido)'),
        f('Banano', '100 g', '1 unidad mediana', 'Manzana 1 u', 'Dátiles 3 u', 'Fruta 100 g'),
      ],
    },
    {
      id: 'E1-cena',
      franja: 'Cena',
      foods: [
        f('Pescado o carne magra', '120 g', '1 palma de la mano', 'Pollo 120 g', '2 huevos + 2 claras', 'Atún 100 g'),
        f('Vegetales al vapor', '150 g', '2 puños', 'Ensalada verde 150 g', 'Espárragos 150 g', 'Coliflor 150 g'),
        f('Aceite de oliva', '5 ml', '1 cucharadita', 'Aguacate 25 g', 'Aceitunas 6 u', 'Semillas 1 cda'),
      ],
    },
  ],
}

const E2: DietScenario = {
  code: 'E2',
  name: 'Gym + Piscina',
  subtitle: 'Doble sesión',
  kcal: 1950,
  carbsG: 175,
  triggerRule: 'Gym/funcional + natación (doble sesión)',
  hydration: 'Agua: 3 L en el día (mayor gasto por doble sesión).',
  atomix: 'Atomix DESPUÉS de la doble sesión (5-10 g en 500 ml). Es día de doble carga.',
  creatina: 'Creatina 3-5 g en el batido post-entreno.',
  color: 'bg-sky-500',
  meals: [
    {
      id: 'E2-desayuno',
      franja: 'Desayuno',
      foods: [
        f('Huevos enteros', '2 u (100 g)', '2 unidades', '4 claras', 'Tofu firme 150 g', 'Atún en agua 60 g'),
        f('Claras de huevo', '3 u (105 g)', '3 claras', '1 huevo entero', 'Yogur griego 100 g', 'Pavo natural 40 g'),
        f('Arepa pequeña', '40 g', '1 arepa / palma', 'Pan integral 40 g', 'Avena cruda 25 g', 'Tortilla integral 1 u'),
        f('Queso fresco bajo en grasa', '20 g', '1 cubo / rebanada', 'Queso panela 20 g', 'Requesón 40 g', 'Cottage 40 g'),
        f('Banano', '80 g', '1 unidad pequeña', 'Manzana 1 u', 'Papaya 100 g', 'Melón 150 g'),
        f('Avena cruda (si entrena fuerte)', '25 g', '2 cucharadas', 'Pan integral 40 g', 'Granola 20 g', 'Quinua cocida 50 g'),
      ],
    },
    {
      id: 'E2-media-manana',
      franja: 'Media mañana',
      foods: [
        f('Yogur griego sin azúcar', '125 g', '½ taza / 1 pote', 'Kumis sin azúcar 125 g', 'Leche descremada 200 ml', 'Cottage 100 g'),
        f('Granola natural', '20 g', '2 cucharadas', 'Avena 20 g', 'Almendras 12 g', 'Barra proteica ½'),
        f('Almendras', '10 u (12 g)', '1 puñado pequeño', 'Nueces 6 u', 'Maní sin sal 12 g', 'Semillas de calabaza 1 cda'),
      ],
    },
    {
      id: 'E2-almuerzo',
      franja: 'Almuerzo',
      foods: [
        f('Pollo pechuga a la plancha', '120 g', '1 palma de la mano', 'Pescado 120 g', 'Carne magra 120 g', 'Pavo 120 g'),
        f('Arroz integral cocido', '120 g', '¾ taza / 1 puño grande', 'Papa cocida 140 g', 'Pasta integral 70 g', 'Quinua cocida 120 g'),
        f('Ensalada mixta', '150 g', '2 puños / plato', 'Brócoli 150 g', 'Espinaca 150 g', 'Zanahoria + pepino 150 g'),
        f('Aguacate', '25 g', '2 cucharadas', 'Aceite de oliva 1 cdta', 'Aceitunas 6 u', 'Semillas de girasol 1 cda'),
      ],
    },
    {
      id: 'E2-pre-entreno',
      franja: 'Pre-entreno (30-45 min antes del gym)',
      foods: [
        f('Pan integral', '40 g', '2 tajadas', 'Arepa pequeña 40 g', 'Tostada integral 2 u', 'Avena 25 g'),
        f('Mermelada sin azúcar', '10 g', '1 cucharada', 'Miel 1 cdta', 'Banano ½', 'Fruta picada 50 g'),
        f('Pavo natural o claras', '40 g / 2 u', 'lonjas / 2 claras', 'Jamón natural 40 g', 'Atún 50 g', 'Yogur natural 100 g'),
      ],
    },
    {
      id: 'E2-post-entreno',
      franja: 'Post-entreno (tras gym + piscina)',
      foods: [
        f('Batido de proteína Savvy', '25 g', '1 scoop', 'Whey 1 scoop', 'Yogur griego 200 g', 'Proteína de comida 30 g'),
        f('Creatina monohidratada', '3-5 g', '1 cucharadita (en el batido)'),
        f('Banano', '100 g', '1 unidad mediana', 'Manzana 1 u', 'Dátiles 3 u', 'Fruta 100 g'),
      ],
    },
    {
      id: 'E2-cena',
      franja: 'Cena',
      foods: [
        f('Pescado o huevos', '120 g / 2 huevos + 2 claras', '1 palma de la mano', 'Pollo 120 g', 'Carne magra 120 g', 'Atún 100 g'),
        f('Batata cocida', '80 g', '1 puño pequeño', 'Papa 80 g', 'Arroz integral 60 g', 'Maíz 80 g'),
        f('Vegetales al vapor', '150 g', '2 puños', 'Ensalada 150 g', 'Brócoli 150 g', 'Calabacín 150 g'),
        f('Aceite de oliva', '5 ml', '1 cucharadita', 'Aguacate 25 g', 'Aceitunas 6 u', 'Semillas 1 cda'),
      ],
    },
  ],
}

const E3: DietScenario = {
  code: 'E3',
  name: 'Fondo largo',
  subtitle: 'Carrera en la mañana — comer para rendir, NO déficit',
  kcal: 2100,
  carbsG: 230,
  triggerRule: 'Carrera larga (fondo/objetivo) en la mañana',
  hydration: 'Agua: la más alta de la semana, sumando lo que bebe en carrera. Grasa un poco más baja hoy para dar espacio a los carbohidratos.',
  atomix: 'Atomix ANTES, DURANTE y DESPUÉS de la carrera. Es EL día clave de electrolitos (previene calambres y caída de rendimiento).',
  creatina: 'Creatina 3-5 g en el batido post-carrera.',
  color: 'bg-emerald-500',
  meals: [
    {
      id: 'E3-pre-carrera',
      franja: 'Pre-carrera (AM, 45-60 min antes de correr)',
      foods: [
        f('Banano', '100 g', '1 unidad', 'Avena 30 g', 'Pan integral + miel', 'Dátiles 3 u'),
        f('Pan integral + mermelada sin azúcar', '40 g + 10 g', '2 tajadas + 1 cda', 'Arepa 40 g', 'Tostadas 2 u', 'Tortilla integral 1 u'),
        f('Agua', '300-500 ml', '1-2 vasos'),
      ],
    },
    {
      id: 'E3-durante',
      franja: 'Durante la carrera',
      foods: [f('Agua con electrolitos Atomix', 'sorbos', '500 ml a lo largo del rodaje')],
    },
    {
      id: 'E3-post-carrera',
      franja: 'Desayuno post-carrera (inmediato)',
      foods: [
        f('Batido Savvy + creatina + banano', '25 g + 3-5 g + 100 g', '1 scoop + 1 cdta + 1 u', 'Whey en vez de Savvy', 'Yogur griego 200 g', 'Fruta 100 g'),
        f('Huevos enteros', '2 u', '2 unidades', '4 claras', 'Atún 60 g', 'Tofu 150 g'),
        f('Avena cocida', '40 g crudos', '4 cucharadas', 'Pan integral 60 g', 'Arepa 60 g', 'Quinua 100 g'),
        f('Fruta', '100 g', '1 unidad', 'Moras ½ taza', 'Papaya 120 g', 'Mango 100 g'),
      ],
    },
    {
      id: 'E3-media-manana',
      franja: 'Media mañana',
      foods: [
        f('Yogur griego sin azúcar', '125 g', '½ taza', 'Kumis 125 g', 'Leche descremada 200 ml', 'Cottage 100 g'),
        f('Granola natural', '20 g', '2 cucharadas', 'Avena 20 g', 'Almendras 12 g', 'Barra proteica ½'),
        f('Fruta', '80 g', '1 unidad', 'Banano ½', 'Pera 1 u', 'Uvas 15 u'),
      ],
    },
    {
      id: 'E3-almuerzo',
      franja: 'Almuerzo',
      foods: [
        f('Pollo pechuga a la plancha', '120 g', '1 palma de la mano', 'Pescado 120 g', 'Carne magra 120 g', 'Pavo 120 g'),
        f('Arroz integral cocido (porción alta)', '130 g', '¾ taza / 1 puño grande', 'Papa 160 g', 'Pasta integral 80 g', 'Quinua 130 g'),
        f('Ensalada mixta', '150 g', '2 puños', 'Brócoli 150 g', 'Espinaca 150 g', 'Mixta 150 g'),
        f('Aguacate', '20 g', '1½ cucharada', 'Aceite de oliva 1 cdta', 'Aceitunas 5 u', 'Semillas de girasol 1 cda'),
      ],
    },
    {
      id: 'E3-merienda',
      franja: 'Media tarde — Merienda (hoy NO es pre-entreno)',
      foods: [
        f('Fruta', '100 g', '1 unidad', 'Yogur 100 g', 'Moras ½ taza', 'Manzana 1 u'),
        f('Almendras', '12 g', '1 puñado', 'Nueces 6 u', 'Maní 12 g', 'Semillas 1 cda'),
      ],
    },
    {
      id: 'E3-cena',
      franja: 'Cena',
      foods: [
        f('Pescado', '120 g', '1 palma de la mano', 'Pollo 120 g', 'Carne magra 120 g', '2 huevos + 2 claras'),
        f('Batata al horno', '120 g', '1 puño', 'Papa 120 g', 'Arroz integral 80 g', 'Plátano cocido 100 g'),
        f('Vegetales al vapor', '150 g', '2 puños', 'Ensalada 150 g', 'Brócoli 150 g', 'Calabacín 150 g'),
        f('Aceite de oliva', '5 ml', '1 cucharadita', 'Aguacate 25 g', 'Aceitunas 6 u', 'Semillas 1 cda'),
      ],
    },
  ],
}

const E4: DietScenario = {
  code: 'E4',
  name: 'Descanso total',
  subtitle: 'Sin entreno — aquí vive el déficit',
  kcal: 1750,
  carbsG: 110,
  triggerRule: 'Día de descanso (sin entreno)',
  hydration: 'Agua: 2,5 L simple en el día.',
  atomix: 'Sin Atomix hoy (no hay entreno). Solo agua.',
  creatina: 'Creatina 3-5 g con cualquier comida (recuerda: también se toma en descanso).',
  color: 'bg-ink-500',
  meals: [
    {
      id: 'E4-desayuno',
      franja: 'Desayuno',
      foods: [
        f('Huevos enteros', '3 u (150 g)', '3 unidades', '2 huevos + 2 claras', 'Tofu 200 g', 'Atún 90 g'),
        f('Queso panela o mozzarella', '40 g', '2 cubos / 1 rebanada', 'Queso fresco 40 g', 'Requesón 60 g', 'Cottage 60 g'),
        f('Espinaca salteada en aceite de oliva', '100 g', '2 puños', 'Acelga 100 g', 'Champiñones 100 g', 'Calabacín 100 g'),
        f('Arándanos', '¼ taza (30 g)', '¼ taza', 'Fresas ½ taza', 'Moras ¼ taza', 'Frambuesas ¼ taza'),
      ],
    },
    {
      id: 'E4-media-manana',
      franja: 'Media mañana',
      foods: [
        f('Yogur griego sin azúcar', '125 g', '½ taza', 'Kumis 125 g', 'Cottage 100 g', 'Leche descremada 200 ml'),
        f('Nueces', '6 u', '1 puñado pequeño', 'Almendras 10 u', 'Maní 12 g', 'Pistachos 15 u'),
        f('Arándanos', '¼ taza (30 g)', '¼ taza', 'Fresas ½ taza', 'Moras ¼ taza', 'Kiwi 1 u'),
        f('Savvy (opcional, para subir proteína)', '10 g', '½ scoop', 'Yogur griego 100 g', 'Clara cocida 2 u', 'Pavo 40 g'),
      ],
    },
    {
      id: 'E4-almuerzo',
      franja: 'Almuerzo',
      foods: [
        f('Pollo o pescado', '120 g', '1 palma de la mano', 'Carne magra 120 g', 'Atún 120 g', 'Pavo 120 g'),
        f('Brócoli / verduras sin almidón', '200 g', '3 puños / plato', 'Espinaca 200 g', 'Coliflor 200 g', 'Calabacín 200 g'),
        f('Aguacate', '25 g', '2 cucharadas', 'Aceite de oliva 1 cdta', 'Aceitunas 6 u', 'Semillas de girasol 1 cda'),
        f('Aceite de oliva', '5 ml', '1 cucharadita', 'Aguacate 25 g', 'Semillas 1 cda', 'Aceitunas 6 u'),
      ],
    },
    {
      id: 'E4-merienda',
      franja: 'Media tarde — Merienda (sin pre-entreno)',
      foods: [
        f('Queso panela', '40 g', '2 cubos', 'Queso fresco 40 g', 'Cottage 60 g', 'Huevo duro 1 u'),
        f('Fresas', '¼ taza', '¼ taza', 'Arándanos ¼ taza', 'Moras ¼ taza', 'Tomate cherry 6 u'),
        f('Almendras', '5 u', '½ puñado', 'Nueces 3 u', 'Maní 6 g', 'Semillas ½ cda'),
      ],
    },
    {
      id: 'E4-cena',
      franja: 'Cena',
      foods: [
        f('2 huevos + 2 claras (o salmón 100 g)', '170 g / 100 g', '2 unidades + 2 claras', 'Pollo 100 g', 'Atún 100 g', 'Pescado blanco 120 g'),
        f('Espinaca salteada', '150 g', '2 puños', 'Acelga 150 g', 'Brócoli 150 g', 'Calabacín 150 g'),
        f('Aguacate', '¼ u (30 g)', '2 cucharadas', 'Aceite de oliva 1 cdta', 'Aceitunas 6 u', 'Semillas de girasol 1 cda'),
        f('Semillas de calabaza', '10 g', '1 cucharada', 'Girasol 1 cda', 'Chía 1 cda', 'Lino 1 cda'),
      ],
    },
  ],
}

export const SCENARIOS: Record<ScenarioCode, DietScenario> = { E1, E2, E3, E4 }
export const SCENARIO_LIST: DietScenario[] = [E1, E2, E3, E4]

export const GENERAL_RULES: string[] = [
  'Proteína alta y constante (~170-175 g/día). La creatina se toma TODOS los días, también en descanso.',
  'Savvy (25 g) aporta 17 g proteína / 4,5 g carbohidrato / 2,5 g grasa / 213 mg sodio. Máximo 1-2 dosis/día, como complemento.',
  'Grasas de calidad: aguacate, aceite de oliva, frutos secos. Evitar bebidas azucaradas, frituras, harinas refinadas y ultraprocesados.',
  'Día flexible: en vacaciones ajusta los horarios, pero conserva el orden de las comidas y las porciones.',
]

export const HOME_MEASURES: { medida: string; equivale: string }[] = [
  { medida: 'Palma de la mano', equivale: '~120 g de proteína (pollo, pescado, carne)' },
  { medida: 'Puño cerrado', equivale: '~1 porción de carbohidrato o de verdura cocida' },
  { medida: 'Puñado', equivale: '~12 g de frutos secos (10 almendras / 6 nueces)' },
  { medida: 'Taza', equivale: '~200 ml / ~125 g de yogur' },
  { medida: 'Cucharada (cda)', equivale: '~10-15 g' },
  { medida: 'Cucharadita (cdta)', equivale: '~5 g / 5 ml' },
]
