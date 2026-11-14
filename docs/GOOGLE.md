# Google Calendar y Gmail

MyLife puede ir de la mano con tu cuenta de Google:

- Lo que creas, cambias o borras en el calendario de la app aparece en tu **Google
  Calendar**, y lo que cambias en Google aparece en la app.
- Los correos que Gmail marca como **importantes** se revisan solos: si uno anuncia un
  evento de verdad (una cita, un examen, un vuelo…), se crea en el calendario.

La configuración se hace **una sola vez** y toma unos 20 minutos. Necesitas tu cuenta
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
- Se sincroniza **cada 5 minutos** y, además, unos segundos después de cada cambio que
  hagas en la app. El botón **Sincronizar ahora** lo hace al instante.
- Si cambias el mismo evento en los dos lados, **gana el cambio más reciente**.
- Los eventos de calendarios de solo lectura (festivos, el de otra persona) se pueden
  marcar como importantes en la app, pero no se pueden cambiar en Google.

**Gmail**

- Cada **30 minutos** se miran los correos de los **últimos 2 días** que Gmail marca
  como **Importantes**. Nunca los de Promociones, Social o Foros, ni los que envías tú.
- Cada correo lo lee **Claude** (de Anthropic) **una sola vez**. Solo se crea el evento
  si de verdad anuncia algo con fecha (cita, examen, vuelo, fecha límite…), si es
  importante (4 o 5 de 5) y si la fecha es de hoy en adelante. Si ya hay un evento con
  el mismo nombre ese día, no se repite.
- El evento sale marcado como **importante**, con una insignia de Gmail y un enlace para
  abrir el correo. También se sube a Google.
- En **Ajustes → Google** está la lista de los últimos correos revisados y qué se
  decidió con cada uno (y por qué se descartó).
- Como mucho se revisan 20 correos por vuelta.

**Cómo deshacer**

- **Un evento que no querías:** bórralo en la app. Se quita también de Google y no
  vuelve a crearse aunque llegue otro correo del mismo evento.
- **No quieres que mire el correo:** apaga el interruptor **Eventos importantes de
  Gmail** en Ajustes. El calendario sigue funcionando.
- **Desconectar del todo:** **Ajustes → Google → Desconectar**. Se le quita el permiso a
  la app en Google. Los eventos que venían de Google desaparecen de la app (en Google
  siguen intactos); los que creaste en la app se quedan en la app y en Google.

**Privacidad**

- El permiso de Google se guarda **cifrado** en Supabase (Vault). Nunca pasa por el
  navegador ni queda en el código.
- El texto de los correos solo se le manda a Anthropic para decidir. En la base queda
  únicamente el asunto, el remitente y la decisión, no el contenido.

---

## Configuración paso a paso

### 1. Crear el proyecto en Google Cloud

1. Entra a <https://console.cloud.google.com> con tu cuenta de Gmail.
2. Arriba a la izquierda, junto al logo, abre el selector de proyectos →
   **Proyecto nuevo**.
3. Nombre: `MyLife`. Toca **Crear** y espera unos segundos.
4. Asegúrate de que arriba quede seleccionado **MyLife**.

### 2. Activar las APIs de Calendar y Gmail

1. Menú (☰) → **APIs y servicios → Biblioteca**.
2. Busca **Google Calendar API**, ábrela y toca **Habilitar**.
3. Vuelve a la Biblioteca, busca **Gmail API** y toca **Habilitar**.

### 3. Pantalla de consentimiento

Es la pantalla que muestra Google cuando la app pide permiso. Según la versión de la
consola se llama **Pantalla de consentimiento de OAuth** o **Google Auth Platform**.

1. Menú (☰) → **APIs y servicios → Pantalla de consentimiento de OAuth** (si sale
   «Google Auth Platform», toca **Comenzar**).
2. **Nombre de la app:** `MyLife`. **Correo de asistencia:** tu Gmail.
3. **Público / Tipo de usuario:** **Externo**.
4. **Información de contacto:** tu Gmail. Acepta las condiciones y toca **Crear**.
5. **Permisos** (en la versión nueva: **Acceso a los datos → Agregar o quitar
   permisos**). Abajo, en **Agregar permisos manualmente**, pega estas líneas y toca
   **Agregar a la tabla**, luego **Actualizar** y **Guardar**:

   ```
   openid
   email
   https://www.googleapis.com/auth/calendar.events
   https://www.googleapis.com/auth/calendar.calendarlist.readonly
   https://www.googleapis.com/auth/gmail.readonly
   ```

6. **Usuarios de prueba** (en la versión nueva: **Público → Usuarios de prueba**):
   **Agregar usuarios** → tu Gmail → **Guardar**.
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

### 5. Clave de Anthropic (para leer los correos)

1. Entra a <https://console.anthropic.com> y crea una cuenta (o inicia sesión).
2. En **Billing** (Facturación) añade crédito. Con **5 USD** sobra para mucho tiempo.
3. En **API Keys** toca **Create Key**, ponle de nombre `MyLife` y copia la clave
   (empieza por `sk-ant-`). Solo se muestra una vez.
4. Opcional: en **Limits** puedes poner un tope de gasto mensual.

> **¿Cuánto cuesta?** Se usa **Claude Haiku**, el modelo más barato: 0,10 USD por cada
> millón de *tokens* (trozos de palabra) que lee y 0,50 USD por millón que escribe. Cada correo cuesta
> alrededor de **0,0005 USD** (medio milésimo de dólar). Con unos 30 correos importantes
> al día son **unos 0,50 USD al mes**. Sin clave de Anthropic el calendario funciona
> igual; solo no se revisa el correo.

### 6. Poner las tres claves en Supabase

1. Entra a <https://supabase.com/dashboard> y abre el proyecto de MyLife.
2. Menú de la izquierda → **Edge Functions → Secrets** (o **Project Settings → Edge
   Functions**).
3. Agrega estos tres secretos, con el nombre **exactamente así** (en mayúsculas):

   | Nombre | Valor |
   |---|---|
   | `GOOGLE_CLIENT_ID` | El ID de cliente del paso 4 |
   | `GOOGLE_CLIENT_SECRET` | El secreto del cliente del paso 4 |
   | `ANTHROPIC_API_KEY` | La clave del paso 5 |

4. Toca **Save**. No hay que desplegar nada: las funciones los leen en la siguiente
   llamada.

### 7. Conectar desde la app

1. En MyLife: **Ajustes → Google → Conectar**.
2. Elige tu cuenta de Google.
3. Si sale **«Google no verificó esta app»**: **Configuración avanzada → Ir a MyLife
   (no seguro)**.
4. Deja marcados **todos** los permisos y toca **Continuar**. Si desmarcas el de Gmail,
   el calendario funciona igual pero no se revisa el correo.
5. Vuelves a Ajustes con el mensaje de **conectado**. En menos de un minuto aparecen tus
   eventos de Google en el calendario.

---

## Solución de problemas

| Qué pasa | Qué hacer |
|---|---|
| La app dice **«El servidor aún no tiene las claves de Google»** | Faltan los secretos del paso 6, o un nombre quedó mal escrito. Revísalos letra por letra. |
| Google muestra **`redirect_uri_mismatch`** | La URI del paso 4 no es idéntica. Cópiala otra vez de esta guía: `https`, sin barra al final. |
| Google dice **«Acceso bloqueado»** o **`access_denied`** | Tu Gmail no está en *Usuarios de prueba* (paso 3.6), o tocaste *Cancelar*. Agrégalo y vuelve a conectar. |
| Pide **Reconectar** cada semana | La app sigue en modo **Prueba**. Publícala (paso 3.7) y reconecta una vez. |
| Pide **Reconectar** de repente | Cambiaste la contraseña de Google, quitaste el acceso en <https://myaccount.google.com/permissions>, o pasaron muchos meses sin usarse. Toca **Reconectar**. |
| No aparecen los eventos de un calendario | Enciéndelo en **Ajustes → Google** (al principio solo se ve el principal). Recuerda que se traen 60 días atrás y un año adelante. |
| Un evento de la app no llega a Google | Espera 5 minutos o toca **Sincronizar ahora**. Los del colegio no se suben, a propósito. |
| Gmail no crea ningún evento | Mira **Últimos correos revisados** en Ajustes: cada correo dice por qué se descartó. Solo cuentan los que Gmail marca como Importantes. Revisa que el interruptor de Gmail esté encendido y que diste el permiso de Gmail al conectar. |
| Error **«Anthropic rechazó la clave»** o **sin saldo** | La clave del paso 5 está mal copiada, se borró o la cuenta se quedó sin crédito. Corrige el secreto o recarga. Los correos pendientes se revisan solos en la siguiente vuelta. |
| Se creó un evento que no era | Bórralo en la app: se quita de Google y no vuelve. |
| Quiero ver qué pasó por dentro | Supabase → **Edge Functions** → `google-sync`, `gmail-scan` o `google-auth` → **Logs**. |

---

## Para quien mantenga el código

- Funciones: `supabase/functions/google-auth`, `google-sync`, `gmail-scan`; código
  común en `supabase/functions/_shared/` (tokens, fechas en hora de Bogotá, conversión
  de eventos, subida y bajada). Se despliegan con `verify_jwt` apagado y validan dentro
  el token del cron (`x-cron-token`) o el JWT del usuario.
- Base de datos: migración `supabase/migrations/20261114184529_google_calendar_y_gmail.sql`
  (tablas `google_conexion`, `google_tokens`, `google_oauth_estados`,
  `gmail_procesados`; columnas nuevas de `calendar_events`; crons `google-sync-5min` y
  `gmail-scan-30min`).
- La base marca `google_pendiente` sola (trigger) cuando la app escribe un evento; la
  app nunca manda las columnas `google_*`.
