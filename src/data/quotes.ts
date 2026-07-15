export interface Quote {
  text: string
  author: string
}

export const QUOTES: Quote[] = [
  { text: 'No cuentes los días, haz que los días cuenten.', author: 'Muhammad Ali' },
  { text: 'Odié cada minuto de entrenamiento, pero me dije: no renuncies. Sufre ahora y vive el resto de tu vida como un campeón.', author: 'Muhammad Ali' },
  { text: 'He fallado una y otra vez en mi vida. Y por eso he tenido éxito.', author: 'Michael Jordan' },
  { text: 'Los límites, como los miedos, muchas veces son solo una ilusión.', author: 'Michael Jordan' },
  { text: 'Las grandes cosas nacen del trabajo duro y la perseverancia. Sin excusas.', author: 'Kobe Bryant' },
  { text: 'Descansa al final, no en el medio.', author: 'Kobe Bryant' },
  { text: 'Cuando tu mente te diga que estás acabado, en realidad estás apenas al 40 % de tu capacidad.', author: 'David Goggins' },
  { text: 'La motivación va y viene; la disciplina es la que te saca de la cama.', author: 'David Goggins' },
  { text: 'Al amanecer, cuando te cueste levantarte, piensa: me levanto para hacer el trabajo de un ser humano.', author: 'Marco Aurelio' },
  { text: 'Lo que se interpone en el camino se convierte en el camino.', author: 'Marco Aurelio' },
  { text: 'Tienes poder sobre tu mente, no sobre los acontecimientos. Date cuenta de esto y encontrarás la fuerza.', author: 'Marco Aurelio' },
  { text: 'No nos atrevemos a muchas cosas porque son difíciles, pero son difíciles porque no nos atrevemos.', author: 'Séneca' },
  { text: 'La suerte es lo que sucede cuando la preparación se encuentra con la oportunidad.', author: 'Séneca' },
  { text: 'Somos lo que hacemos repetidamente. La excelencia, entonces, no es un acto, sino un hábito.', author: 'Aristóteles' },
  { text: 'Ninguna cosa grande se crea de repente.', author: 'Epicteto' },
  { text: 'No importa lo lento que vayas mientras no te detengas.', author: 'Confucio' },
  { text: 'Un viaje de mil millas comienza con un solo paso.', author: 'Lao-Tsé' },
  { text: 'Aguanta y persiste: este dolor te será útil algún día.', author: 'Ovidio' },
  { text: 'Entrené cuatro años para correr nueve segundos.', author: 'Usain Bolt' },
  { text: 'Solo los disciplinados son libres en la vida.', author: 'Eliud Kipchoge' },
  { text: 'Ningún ser humano tiene límites.', author: 'Eliud Kipchoge' },
  { text: 'Un campeón se define no por sus victorias, sino por cómo se recupera cuando cae.', author: 'Serena Williams' },
  { text: 'El talento sin trabajo no es nada.', author: 'Cristiano Ronaldo' },
  { text: 'Me tomó 17 años y 114 días convertirme en un éxito de la noche a la mañana.', author: 'Lionel Messi' },
  { text: 'No se trata de si te derriban, sino de si te levantas.', author: 'Vince Lombardi' },
  { text: 'La diferencia entre una persona exitosa y las demás no es la falta de fuerza ni de conocimiento, sino la falta de voluntad.', author: 'Vince Lombardi' },
  { text: 'Todo el mundo tiene un plan hasta que recibe el primer golpe.', author: 'Mike Tyson' },
  { text: 'No temo al hombre que ha practicado 10.000 patadas distintas, sino al que ha practicado una patada 10.000 veces.', author: 'Bruce Lee' },
  { text: 'No pidas una vida fácil; pide la fuerza para soportar una difícil.', author: 'Bruce Lee' },
  { text: 'La disciplina es el puente entre las metas y los logros.', author: 'Jim Rohn' },
  { text: 'La motivación es lo que te pone en marcha; el hábito es lo que te mantiene.', author: 'Jim Ryun' },
  { text: 'El éxito es la suma de pequeños esfuerzos repetidos día tras día.', author: 'Robert Collier' },
  { text: 'Las últimas tres o cuatro repeticiones son las que hacen crecer el músculo.', author: 'Arnold Schwarzenegger' },
  { text: 'Si quieres correr, corre una milla. Si quieres experimentar una vida distinta, corre un maratón.', author: 'Emil Zátopek' },
  { text: 'Dar menos que tu mejor esfuerzo es sacrificar el don.', author: 'Steve Prefontaine' },
  { text: 'Sigue apareciendo: muchos días no tendrás ganas, ve igual.', author: 'Des Linden' },
  { text: 'El éxito no es casualidad: es trabajo duro, perseverancia, aprendizaje, sacrificio y, sobre todo, amor por lo que haces.', author: 'Pelé' },
  { text: 'Nuestra mayor debilidad está en rendirnos. La forma más segura de tener éxito es intentarlo una vez más.', author: 'Thomas Edison' },
  { text: 'Siempre parece imposible hasta que se hace.', author: 'Nelson Mandela' },
  { text: 'Lo que la mente puede concebir y creer, lo puede lograr.', author: 'Napoleon Hill' },
]

export function quoteForDate(iso: string): Quote {
  const dayIndex = Math.floor(Date.parse(`${iso}T00:00:00Z`) / 86_400_000)
  return QUOTES[((dayIndex % QUOTES.length) + QUOTES.length) % QUOTES.length]
}
