# Google Calendar

MyLife puede ir de la mano con tu cuenta de Google: lo que creas, cambias o borras en el
calendario de la app aparece en tu **Google Calendar**, y lo que cambias en Google
aparece en la app. Se sincroniza sola **cada lunes por la mañana** (por si te citan a
alguna reunión) y, cuando quieras, al instante con **Sincronizar ahora**.

La configuración se hace **una sola vez** y toma unos 15 minutos. Necesitas tu cuenta
de Google y acceso al panel de Supabase del proyecto.

---

## Cómo funciona

**Calendario, en los dos sentidos**

- Los eventos que creas en la app van a tu **calendario principal** de Google. Los del
  calendario del colegio no se suben (ya están en la app para todos los dispositivos).
- En la app ves los eventos de los calendarios de Google que tengas **visibles**. Al
  principio solo el principal; en **Ajustes → Google** puedes encender otros (por
  ejemplo, «Festivos en Colombia»).
- Se trae lo que va de **60 días atrás a un año adelante**.
- Se sincroniza sola **una vez por semana: los lunes a las 6:00** (hora de Colombia).
  Lo que cambies en la app entre semana queda guardado y sube a Google ese lunes; lo que
  cambie en Google llega a la app también el lunes.
- **Sincronizar ahora** (en **Ajustes → Google**) manda y trae los cambios al instante.
  También se sincroniza en el momento al conectar la cuenta y al encender u ocultar un
  calendario en Ajustes.
- Si cambias el mismo evento en los dos lados, **gana el cambio más reciente**.
- A Google solo sube lo que cambiaste: marcar un evento como importante o cambiarle el
  tipo no toca Google (eso solo existe en la app), y cambiar la hora no reescribe la
  descripción.
- Los eventos de calendarios de solo lectura (festivos, el de otra persona) se pueden
  marcar como importantes en la app, pero no se pueden cambiar en Google.

**Cómo deshacer**

- **Un evento que no querías:** bórralo en la app. Se quita también de Google en la
  siguiente sincronización (el lunes, o al tocar **Sincronizar ahora**).
- **Desconectar del todo:** **Ajustes → Google → Desconectar**. Se le quita el permiso a
  la app en Google. Los eventos que venían de Google desaparecen de la app (en Google
  siguen intactos); los que creaste en la app se quedan en la app y en Google.

**Solo la cuenta del dueño**

- Google solo se puede conectar desde **tu** cuenta de MyLife (la que entra con tu
  código). Cualquier otra cuenta que se abra en la app ve en **Ajustes → Google** el
  aviso **«Esta cuenta de MyLife no tiene permiso para conectar Google»**, y el servidor
  no sincroniza nada para ella.
- Es a propósito: sin esa regla, alguien con otra cuenta podría mandarte su enlace de
  «Conectar con Google» y quedarse con el permiso de tu calendario.
- La lista de cuentas permitidas es la tabla `google_permitidos` en Supabase (solo la
  puede tocar el servidor). Si algún día cambias de código y tu cuenta de MyLife es otra,
  hay que añadir el nuevo `user_id` ahí desde el panel de Supabase (Table Editor).

**Privacidad**

- El permiso de Google se guarda **cifrado** en Supabase (Vault). Nunca pasa por el
  navegador ni queda en el código.
- La app solo pide permiso para tu **calendario** (y tu email, para mostrar con qué
  cuenta está conectada). No lee tu correo.

---

## Configuración paso a paso

### 1. Crear el proyecto en Google Cloud

1. Entra a <https://console.cloud.google.com> con tu cuenta de Google.
2. Arriba a la izquierda, junto al logo, abre el selector de proyectos →
   **Proyecto nuevo**.
3. Nombre: `MyLife`. Toca **Crear** y espera unos segundos.
4. Asegúrate de que arriba quede seleccionado **MyLife**.

### 2. Activar la API de Calendar

1. Menú (☰) → **APIs y servicios → Biblioteca**.
2. Busca **Google Calendar API**, ábrela y toca **Habilitar**.

### 3. Pantalla de consentimiento

Es la pantalla que muestra Google cuando la app pide permiso. Según la versión de la
consola se llama **Pantalla de consentimiento de OAuth** o **Google Auth Platform**.

1. Menú (☰) → **APIs y servicios → Pantalla de consentimiento de OAuth** (si sale
   «Google Auth Platform», toca **Comenzar**).
2. **Nombre de la app:** `MyLife`. **Correo de asistencia:** tu email de Google.
3. **Público / Tipo de usuario:** **Externo**.
4. **Información de contacto:** tu email de Google. Acepta las condiciones y toca **Crear**.
5. **Permisos** (en la versión nueva: **Acceso a los datos → Agregar o quitar
   permisos**). Abajo, en **Agregar permisos manualmente**, pega estas líneas y toca
   **Agregar a la tabla**, luego **Actualizar** y **Guardar**:

   ```
   openid
   email
   https://www.googleapis.com/auth/calendar.events
   https://www.googleapis.com/auth/calendar.calendarlist.readonly
   ```

6. **Usuarios de prueba** (en la versión nueva: **Público → Usuarios de prueba**):
   **Agregar usuarios** → tu email de Google → **Guardar**.
7. **Publica la app.** En **Público** (o en el resumen de la pantalla de
   consentimiento), en *Estado de publicación* toca **Publicar app** → **Confirmar**.
   Debe quedar **En producción**.

   > **¿Por qué publicarla?** Mientras está en modo **Prueba**, Google hace caducar el
   > permiso **cada 7 días**: la sincronización se cortaría cada semana y tendrías que
   > volver a conectar. En producción eso no pasa.
   >
   > Google no va a revisar la app (eso solo hace falta para apps públicas), así que al
   > conectar verás un aviso de **«Google no verificó esta app»**. Es normal: la app es
   > tuya. Toca **Configuración avanzada → Ir a MyLife (no seguro)**.

### 4. Crear el cliente OAuth

1. Menú (☰) → **APIs y servicios → Credenciales → Crear credenciales → ID de cliente
   de OAuth** (en la versión nueva: **Google Auth Platform → Clientes → Crear
   cliente**).
2. **Tipo de aplicación:** **Aplicación web**. **Nombre:** `MyLife`.
3. **Orígenes de JavaScript autorizados:** déjalo vacío.
4. **URI de redireccionamiento autorizados → Agregar URI**, y pega **exactamente**
   (sin espacios ni barra al final):

   ```
   https://laabrbjtxugddlxtryou.supabase.co/functions/v1/google-auth
   ```

5. Toca **Crear**. Copia y guarda en un lugar seguro el **ID de cliente** y el
   **Secreto del cliente**. En la consola nueva el secreto solo se ve completo esta
   vez: si lo pierdes, crea otro en la página del cliente.

### 5. Poner las dos claves en Supabase

1. Entra a <https://supabase.com/dashboard> y abre el proyecto de MyLife.
2. Menú de la izquierda → **Edge Functions → Secrets** (o **Project Settings → Edge
   Functions**).
3. Agrega estos dos secretos, con el nombre **exactamente así** (en mayúsculas):

   | Nombre | Valor |
   |---|---|
   | `GOOGLE_CLIENT_ID` | El ID de cliente del paso 4 |
   | `GOOGLE_CLIENT_SECRET` | El secreto del cliente del paso 4 |

4. Toca **Save**. No hay que desplegar nada: las funciones los leen en la siguiente
   llamada.

### 6. Conectar desde la app

1. En MyLife: **Ajustes → Google → Conectar**.
2. Elige tu cuenta de Google.
3. Si sale **«Google no verificó esta app»**: **Configuración avanzada → Ir a MyLife
   (no seguro)**.
4. Deja marcados **todos** los permisos y toca **Continuar**. Sin el del calendario no
   hay nada que sincronizar.
5. Vuelves a Ajustes con el mensaje de **conectado**. En menos de un minuto aparecen tus
   eventos de Google en el calendario.

---

## Solución de problemas

| Qué pasa | Qué hacer |
|---|---|
| Ajustes dice **«Esta cuenta de MyLife no tiene permiso para conectar Google»** | Entraste con un código distinto al tuyo. Entra con tu código; si cambiaste de código a propósito, añade tu nuevo `user_id` a la tabla `google_permitidos` (ver «Solo la cuenta del dueño»). |
| Ajustes dice **«No se pudo leer el estado de Google»** | No había internet al abrir Ajustes. Toca **Reintentar**. |
| La app dice **«El servidor aún no tiene las claves de Google»** | Faltan los secretos del paso 5, o un nombre quedó mal escrito. Revísalos letra por letra. |
| Google muestra **`redirect_uri_mismatch`** | La URI del paso 4 no es idéntica. Cópiala otra vez de esta guía: `https`, sin barra al final. |
| Google dice **«Acceso bloqueado»** o **`access_denied`** | Tu email no está en *Usuarios de prueba* (paso 3.6), o tocaste *Cancelar*. Agrégalo y vuelve a conectar. |
| Pide **Reconectar** cada semana | La app sigue en modo **Prueba**. Publícala (paso 3.7) y reconecta una vez. |
| Pide **Reconectar** de repente | Cambiaste la contraseña de Google, quitaste el acceso en <https://myaccount.google.com/permissions>, o pasaron muchos meses sin usarse. Toca **Reconectar**. |
| No aparecen los eventos de un calendario | Enciéndelo en **Ajustes → Google** (al principio solo se ve el principal). Recuerda que se traen 60 días atrás y un año adelante. |
| Un evento de la app no llega a Google (o uno de Google no sale en la app) | Es normal entre semana: la sincronización automática es los lunes por la mañana. Toca **Sincronizar ahora** para hacerlo ya. Los del colegio no se suben, a propósito. |
| Quiero ver qué pasó por dentro | Supabase → **Edge Functions** → `google-sync` o `google-auth` → **Logs**. |

---

## Para quien mantenga el código

- Funciones: `supabase/functions/google-auth` y `google-sync`; código común en
  `supabase/functions/_shared/` (tokens, fechas en hora de Bogotá, conversión de
  eventos, subida y bajada). Se despliegan con `verify_jwt` apagado y validan dentro el
  token del cron (`x-cron-token`) o el JWT del usuario.
- Cuándo corre `google-sync`: el cron `google-sync-lunes` (`0 11 * * 1` en UTC, las 6:00
  del lunes en Bogotá, vía `disparar_google`), el botón **Sincronizar ahora**, el cambio
  de calendarios visibles en Ajustes y la primera sincronización al conectar. Editar un
  evento en la app **no** la llama: queda pendiente hasta el lunes.
- Base de datos: migraciones `supabase/migrations/20261114184529_google_calendar_y_gmail.sql`
  (tablas `google_conexion`, `google_tokens`, `google_oauth_estados`; columnas nuevas de
  `calendar_events`), `20261115180518_google_solo_dueno_y_cambios.sql` (tabla
  `google_permitidos`, columna `google_cambios`) y la que retira la importación desde el
  correo y deja el cron semanal (`*_quitar_gmail_y_sync_semanal.sql`). Las dos primeras
  todavía mencionan Gmail porque son historia: ya no queda nada de eso en la base.
- La base marca `google_pendiente` sola (trigger) cuando la app cambia algo que se sube
  (título, fechas, horas, lugar, notas, borrado) y anota cuáles en `google_cambios`; el
  PATCH a Google lleva solo esos campos. La app nunca manda las columnas `google_*`.
- Códigos de error de las funciones: `no_autorizado` (401), `no_permitido` (403),
  `falta_configuracion`, `reconectar`, `no_conectado`, `volver_a_no_permitido`,
  `error_sync`.
  Los textos para el usuario están en `mensajeDeError` (`src/lib/google.ts`).
