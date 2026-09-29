# Patrones de diseño aplicados

Documentación detallada de los 5 patrones usados en el proyecto: intención,
problema real que resuelven en el consultorio, solución aplicada (con el
código real del repositorio) y consecuencias. Formato y vocabulario
alineados con el catálogo de
[refactoring.guru/es/design-patterns](https://refactoring.guru/es/design-patterns).

## 1. Singleton

**Intención.** Garantizar que una clase tenga una única instancia y
proporcionar un punto de acceso global a ella.

**Problema en este proyecto.** Cada componente o ruta que necesita hablar
con Supabase podría crear su propio cliente (`createClient(...)`) con sus
propias credenciales. Eso desperdicia conexiones, dificulta cambiar la
configuración en un solo lugar, y en el caso del cliente con *Service Role*
(usado por rutas públicas como la confirmación de citas) sería además un
riesgo de seguridad tener esa llave instanciada en más de un sitio del
código.

**Solución aplicada.** `getSupabaseBrowserClient()` guarda la instancia en
una variable de módulo (`browserClient`) y la crea solo la primera vez que
se solicita; llamadas posteriores devuelven la misma instancia.
`getSupabaseAdminClient()` (en `server.ts`) hace lo mismo para el cliente
con *Service Role*, usado exclusivamente por rutas de servidor sin sesión de
usuario (cron de recordatorios, confirmación por token, encuesta).

```ts
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(/* ... */);
  }
  return browserClient;
}
```

**Consecuencias.** Una sola configuración de conexión que actualizar; menor
riesgo de instanciar por error la llave de Service Role en código de
cliente.

**Code smell que resuelve:** *Duplicated Code* — la misma lógica de
conexión repetida en cada archivo que necesitara la base de datos.

## 2. Repository

**Intención.** Encapsular la lógica de acceso a datos detrás de una
interfaz orientada al dominio, para que el resto de la aplicación hable de
"pacientes" y "citas" y no de tablas ni de consultas SQL/Supabase.

**Problema en este proyecto.** Sin este patrón, cada página o ruta API que
necesita pacientes o citas llamaría directamente
`supabase.from("patients").select(...)`, repitiendo la misma consulta en
varios archivos. Un cambio de proveedor de base de datos, o simplemente
agregar una validación al crear un paciente, obligaría a tocar cada lugar
donde se repitió esa consulta.

**Solución aplicada.** `IPatientRepository` e `IAppointmentRepository`
definen el contrato (`findAll`, `findById`, `create`, `update`, etc.);
`SupabasePatientRepository` y `SupabaseAppointmentRepository` son la única
implementación concreta que sabe que la base de datos es Supabase. Páginas
y rutas API dependen siempre de la interfaz.

```ts
export interface IPatientRepository {
  findAll(): Promise<Patient[]>;
  findById(id: string): Promise<Patient | null>;
  create(data: Omit<Patient, "id" | "doctor_id" | "created_at" | "updated_at">): Promise<Patient>;
  update(id: string, data: Partial<Patient>): Promise<Patient>;
}
```

**Consecuencias.** El acceso a datos queda en un solo lugar por entidad;
más fácil de probar (se puede sustituir por un repositorio en memoria en
pruebas unitarias); un cambio de proveedor de base de datos solo tocaría la
implementación concreta, nunca las páginas.

**Code smell que resuelve:** *Divergent Change* / *Shotgun Surgery* — un
cambio en cómo se guardan los pacientes obligaría a modificar muchos
archivos distintos.

## 3. Factory Method

**Intención.** Definir una interfaz para crear un objeto, pero dejar que
una función/clase decida qué variante concreta construir, evitando
condicionales repetidos por tipo.

**Problema en este proyecto.** Los tres documentos (justificante, constancia,
permiso escolar) comparten el mismo membrete, tipografía y pie de página; lo
único que cambia es el título y los párrafos del cuerpo. Sin este patrón,
`generateDocumentPdf` tendría un `if/else` gigante mezclando maquetado
(posiciones, fuentes, colores) con el texto de cada tipo de documento, que
crecería cada vez que se agrega un nuevo tipo de documento.

**Solución aplicada.** `buildBodyParagraphs(req)` es el punto de variación:
según `document_type`, arma los párrafos correctos, pero **todo el resto**
del documento (membrete, título, firma, pie de página) se construye una sola
vez en `generateDocumentPdf`, reutilizado sin importar el tipo.

```ts
function buildBodyParagraphs(req: DocumentRequest): string[] {
  switch (req.document_type) {
    case "justificante": return [/* párrafos de justificante */];
    case "constancia": return [/* párrafos de constancia */];
    case "permiso_escolar": return [/* párrafos de permiso */];
  }
}
```

**Consecuencias.** Agregar un cuarto tipo de documento significa añadir un
caso a `buildBodyParagraphs` y a `TITLES`, sin tocar el membrete, la firma
ni el pie de página ya probados.

**Code smell que resuelve:** *Switch Statements* — el mismo condicional
por tipo repetido cada vez que se necesita dibujar un documento.

## 4. Strategy

**Intención.** Definir una familia de algoritmos intercambiables (en este
caso, canales de notificación) detrás de una interfaz común, de forma que
quien notifica no necesite saber por cuál canal se está enviando.

**Problema en este proyecto.** El cron de recordatorios y la ruta que marca
una cita como completada (para enviar la encuesta) ambos necesitan "avisarle
algo a alguien". Sin este patrón, cada uno tendría su propio
`if (canal === "email") ... else if (canal === "whatsapp") ...`, duplicado
en dos lugares y que crecería con cada canal nuevo.

**Solución aplicada.** `NotificationChannel` es la interfaz
(`send(to, subject, message)`); `EmailChannel` la implementa con Resend hoy,
y `WhatsAppChannel` queda lista como implementación de referencia para
conectar un proveedor real. `NotificationService` solo conoce la interfaz.

**Antes** (sin el patrón):

```ts
async function enviarRecordatorio(paciente, mensaje, canal: string) {
  if (canal === "email") {
    await resend.emails.send({ to: paciente.email, html: mensaje });
  } else if (canal === "whatsapp") {
    await twilioClient.messages.create({ to: paciente.telefono, body: mensaje });
  }
  // cada canal nuevo obliga a tocar esta función Y la de la encuesta,
  // que tendría el mismo if/else duplicado.
}
```

**Después** (patrón Strategy):

```ts
export interface NotificationChannel {
  send(to: string, subject: string, message: string): Promise<void>;
}

export class NotificationService {
  constructor(private channel: NotificationChannel) {}
  async notify(to: string, subject: string, message: string) {
    await this.channel.send(to, subject, message);
  }
}
```

```ts
const notifier = new NotificationService(new EmailChannel());
await notifier.notify(paciente.email, "Confirma tu cita", mensaje);
```

**Consecuencias.** Agregar un canal real de WhatsApp/SMS es una clase nueva
que implemente `NotificationChannel` — cero cambios en el cron, en la ruta
de "finalizar cita", ni en ningún otro lugar que ya use
`NotificationService`.

**Code smell que resuelve:** *Switch Statements* — la misma decisión por
canal, repetida en más de un lugar.

## 5. Observer

**Intención.** Definir una dependencia uno-a-muchos entre objetos, de forma
que cuando uno cambia de estado, todos sus dependientes sean notificados
automáticamente, sin que el emisor conozca los detalles de cada uno.

**Problema en este proyecto.** Al guardar una encuesta post-sesión, pueden
pasar varias cosas independientes entre sí: si hay factor de riesgo, avisar
a la psicóloga; a futuro, recalcular estadísticas o tendencias de ánimo del
paciente. Sin este patrón, la ruta `POST /api/survey/[appointmentId]`
tendría que conocer y llamar directamente cada una de esas acciones.

**Solución aplicada.** `SurveyService` mantiene una lista de
`SurveyObserver` suscritos y los notifica a todos cuando se guarda una
encuesta. `RiskAlertObserver` reacciona solo si `risk_factor` es `true` y
envía la alerta (reutilizando el mismo `NotificationService` del patrón
Strategy); `StatisticsObserver` queda como punto de extensión ya cableado.

```ts
export interface SurveyObserver {
  onSurveySubmitted(survey: SessionSurvey, patient: Patient): Promise<void>;
}

export class SurveyService {
  private observers: SurveyObserver[] = [];
  subscribe(observer: SurveyObserver) { this.observers.push(observer); }
  async notifyAll(survey: SessionSurvey, patient: Patient) {
    await Promise.all(this.observers.map((o) => o.onSurveySubmitted(survey, patient)));
  }
}
```

**Consecuencias.** La ruta de la encuesta no sabe (ni le importa) cuántas
cosas pasan después de guardarla; agregar un nuevo comportamiento es una
clase nueva suscrita, sin tocar la ruta ni los observadores existentes.

**Code smell que resuelve:** *Feature Envy* — una ruta de API haciendo
trabajo (notificar, calcular estadísticas) que no le corresponde.

## Resumen: smell → patrón → archivo

| Code smell (refactoring.guru) | Patrón aplicado | Archivo |
|---|---|---|
| Duplicated Code (conexión a la base de datos repetida) | Singleton | `src/lib/supabase/client.ts`, `server.ts` |
| Divergent Change / Shotgun Surgery (acceso a datos disperso) | Repository | `src/lib/repositories/*.ts` |
| Switch Statements (tipo de documento) | Factory Method | `src/lib/pdf/DocumentTemplateFactory.ts` |
| Switch Statements (canal de notificación) | Strategy | `src/lib/patterns/NotificationStrategy.ts` |
| Feature Envy (reacciones tras guardar la encuesta) | Observer | `src/lib/patterns/SurveyObserver.ts` |
