-- Horario nuevo de 11º (emitido el 27/08/2026): cuatro materias cambiaron de código
-- porque cambiaron de nivel o de grupo (SAS pasó a HL, Inglés a SL, y Business y
-- Español cambiaron de grupo).
--
-- Las notas y las tareas guardan el código de la materia, así que sin esto la nota de
-- Business y las tareas de Business y SAS quedarían colgadas de un código que ya no
-- existe: seguirían en la base, pero no aparecerían dentro de la materia.
--
-- Se toca `updated_at` a propósito: la bajada incremental de `src/lib/cloudStore.ts`
-- va por ese cursor, y sin moverlo el celular y el computador se quedarían con el
-- código viejo en su caché.

update public.class_notes n
set class_code = m.nuevo,
    updated_at = now()
from (values ('ESSSL2', 'ESSHL1'),
             ('ENGAHL1', 'ENGASL1'),
             ('BMHL2', 'BMHL3'),
             ('ESPASL2', 'ESPASL1')) as m(viejo, nuevo)
where n.class_code = m.viejo;

update public.tasks t
set class_code = m.nuevo,
    updated_at = now()
from (values ('ESSSL2', 'ESSHL1'),
             ('ENGAHL1', 'ENGASL1'),
             ('BMHL2', 'BMHL3'),
             ('ESPASL2', 'ESPASL1')) as m(viejo, nuevo)
where t.class_code = m.viejo;
