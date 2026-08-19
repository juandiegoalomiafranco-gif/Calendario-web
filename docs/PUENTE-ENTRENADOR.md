# Puente con la app del entrenador

Esto es lo que hay que añadir en **la app del entrenador** para que el plan de
entrenamiento llegue solo a MyLife. Son unas 20 líneas.

## Cómo funciona

Juan Diego genera un **código de atleta** desde *Ajustes → Entrenador* y te lo pasa.
Con ese código tu app puede **publicar** planes en su base de datos. No puede leer
nada: ni sus planes, ni sus datos, ni su identidad. Es una llave de una sola
dirección.

Si el código se filtra, él lo regenera desde la app y el viejo deja de servir.

## Lo que necesitas

| Dato | Valor |
|---|---|
| URL del proyecto | `https://laabrbjtxugddlxtryou.supabase.co` |
| Clave pública (publishable) | te la pasa él junto con el código |
| Tabla | `coach_plans` |
| Código de atleta | te lo pasa él (empieza por `atleta-`) |

La clave publishable es pública por diseño: las tablas están protegidas por RLS.

## El código

Con `@supabase/supabase-js`:

```ts
import { createClient } from '@supabase/supabase-js'

const mylife = createClient(
  'https://laabrbjtxugddlxtryou.supabase.co',
  'LA_PUBLISHABLE_KEY_QUE_TE_PASO',
)

/** Publica el plan de una semana en la app de Juan Diego. */
export async function publicarPlan(codigoDeAtleta: string, plan: PlanSemana) {
  const { error } = await mylife.from('coach_plans').insert({
    athlete_code: codigoDeAtleta,
    coach_name: 'Tu nombre',
    week_start: plan.lunes,          // 'YYYY-MM-DD', opcional
    payload: { dias: plan.dias },
  })
  if (error) throw new Error(error.message)
}
```

Sin librería, con `fetch`:

```ts
await fetch('https://laabrbjtxugddlxtryou.supabase.co/rest/v1/coach_plans', {
  method: 'POST',
  headers: {
    apikey: 'LA_PUBLISHABLE_KEY',
    Authorization: 'Bearer LA_PUBLISHABLE_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    athlete_code: codigoDeAtleta,
    coach_name: 'Tu nombre',
    week_start: '2026-08-24',
    payload: { dias: [...] },
  }),
})
```

## Forma del `payload`

```json
{
  "dias": [
    {
      "fecha": "2026-08-20",
      "nota": "Semana de carga. No te saltes el calentamiento.",
      "sesiones": [
        {
          "titulo": "Fuerza — tren inferior",
          "tipo": "crossfit",
          "resumen": "Sentadilla 5x5, peso muerto 4x6, accesorios.",
          "estructura": ["Sentadilla 5x5 @ 70%", "Peso muerto 4x6", "Core 3x"]
        },
        {
          "titulo": "Rodaje suave",
          "tipo": "running-easy",
          "distanciaKm": "6",
          "resumen": "Zona 2, conversado."
        }
      ]
    }
  ]
}
```

### Valores válidos de `tipo`

`crossfit`, `running-easy`, `running-long`, `running-shakeout`, `running-goal`,
`swim-technique`, `swim-endurance`, `flex`, `rest`.

Cualquier otro valor se guarda como `crossfit`, así que no se rompe nada, pero la
comida del día se calcula peor: **el tipo importa**. Con `running-long` la app sube
los carbohidratos; con dos sesiones el mismo día pasa al escenario de doble sesión; y
en `rest` baja a déficit.

## Qué pasa del otro lado

En cuanto publiques, el plan aparece en *Ajustes → Entrenador* y la pantalla de
**Comida** recalcula sola el escenario del día y la lonchera del colegio, con sus
gramos.

## Errores

- `Código de atleta desconocido` — el código está mal escrito o él lo regeneró.
- `new row violates row-level security policy` — falta el `athlete_code`, o la clave
  no es la publishable de ese proyecto.
