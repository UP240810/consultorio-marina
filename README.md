# Consultorio Marina Velázquez Tristán

Organizador integral para un consultorio de psicología: agenda, expedientes de
pacientes, notas de sesión, encuestas post-consulta, estadísticas de
ingresos/gastos, recordatorios automáticos de citas y generación de PDFs
(justificantes, constancias, permisos escolares).

Construido con **Next.js 14 (App Router) + TypeScript**, **Supabase**
(Postgres, Auth, Row Level Security) y pensado para desplegarse en **Vercel**
(incluye Vercel Cron para los recordatorios diarios).

---

## 1. Índice

- [Características](#2-características)
- [Arquitectura y patrones de diseño](#3-arquitectura-y-patrones-de-diseño)
  - [Singleton](#31-singleton)
  - [Repository](#32-repository)
  - [Factory Method](#33-factory-method)
  - [Strategy](#34-strategy)
  - [Observer](#35-observer)
  - [Diseño y animación](#36-diseño-y-animación)
  - [Refactorización](#37-refactorización)
- [Diagramas (PlantUML)](#4-diagramas-plantuml)
- [Modelo de datos](#5-modelo-de-datos)
- [Puesta en marcha local](#6-puesta-en-marcha-local)
- [Despliegue en Vercel + Supabase](#7-despliegue-en-vercel--supabase)
- [Recordatorios automáticos (cron)](#8-recordatorios-automáticos-cron)
- [Generación de PDFs](#9-generación-de-pdfs)
- [Encuesta post-sesión](#10-encuesta-post-sesión)
- [Estructura de carpetas](#11-estructura-de-carpetas)
- [Roadmap / siguientes pasos](#12-roadmap--siguientes-pasos)

---

## 2. Características

- **Login** de la psicóloga con Supabase Auth y una frase motivadora distinta
  cada día (banco de **500 frases** generadas en `scripts/generate_quotes.py`).
- **Agenda** con horario fijo de **8:00 a.m. a 8:00 p.m.**, en franjas de 50
  minutos, navegable por día.
- **Pacientes**: alta, edición y ficha con nombre, edad, ocupación, teléfono,
  correo, contacto de emergencia, medicación actual y estatus.
- **Notas de sesión** por paciente (historial cronológico).
- **Citas**: creación desde la agenda o desde la ficha del paciente; al
  finalizar una cita se puede "Finalizar y enviar encuesta" en un clic.
- **Recordatorios diarios automáticos**: un cron corre una vez al día y envía
  por correo, a cada paciente con cita ese día, un enlace único para
  **confirmar su asistencia** (sin necesidad de cuenta ni contraseña).
- **Encuesta post-consulta**: preguntas de opción simple con botones, escala
  de 1 a 10 de qué tan cerca está el alta, y una pregunta de factor de riesgo
  que, si se marca, dispara una alerta automática (patrón Observer).
- **Estadísticas**: ingresos, gastos, balance del mes, citas completadas /
  canceladas / inasistencias, y gráfica de ingresos vs. gastos de 6 meses.
- **Documentos en PDF** personalizables: justificante de atención
  psicológica, constancia de asistencia a terapia o permiso/justificación
  escolar, con acabado profesional y membrete morado con el símbolo Ψ.
- **Multi-dispositivo / responsivo**, tema morado en toda la interfaz.

## 3. Arquitectura y patrones de diseño

El proyecto sigue una arquitectura por capas — **UI (páginas/componentes) →
servicios y patrones → repositorios → Supabase** — para mantener las bases
de la Programación Orientada a Objetos (encapsulamiento del acceso a datos,
polimorfismo mediante interfaces, responsabilidad única por clase) y
facilitar pruebas y mantenimiento. Se aplican 5 patrones de diseño, cada uno
elegido para resolver un problema concreto del dominio, no como catálogo:

| Patrón | Categoría (GoF) | Dónde | Para qué |
|---|---|---|---|
| **Singleton** | Creacional | `src/lib/supabase/client.ts`, `server.ts` | Una sola instancia del cliente de Supabase (browser y admin) reutilizada en toda la app. |
| **Repository** | (patrón de arquitectura, no GoF) | `src/lib/repositories/*.ts` | Aísla el acceso a datos (Supabase) de la lógica de negocio y de la UI. |
| **Factory Method** | Creacional | `src/lib/pdf/DocumentTemplateFactory.ts` | Genera el PDF correcto (justificante / constancia / permiso escolar) a partir del mismo membrete y estructura base. |
| **Strategy** | Comportamiento | `src/lib/patterns/NotificationStrategy.ts` | Intercambia el canal de notificación (correo hoy vía Resend; WhatsApp/SMS listo para conectar) sin tocar quien lo usa. |
| **Observer** | Comportamiento | `src/lib/patterns/SurveyObserver.ts` | Al enviarse una encuesta, notifica a quien esté suscrito (alerta de riesgo, estadísticas futuras) sin acoplar esa lógica al formulario. |

A continuación, cada patrón documentado con su intención, el problema
concreto que resuelve en este proyecto, la solución aplicada y sus
consecuencias — el mismo formato con el que refactoring.guru describe cada
patrón en su catálogo (<https://refactoring.guru/es/design-patterns>).

### 3.1 Singleton

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
cliente; costo estándar del patrón (estado global a nivel de módulo, que en
Next.js vive por proceso/servidor, no compartido entre usuarios).

### 3.2 Repository

**Intención.** Encapsular la lógica de acceso a datos detrás de una
interfaz orientada al dominio, para que el resto de la aplicación hable de
"pacientes" y "citas" y no de tablas ni de consultas SQL/Supabase.

**Problema en este proyecto.** Sin este patrón, cada página o ruta API que
necesita pacientes o citas llamaría directamente
`supabase.from("patients").select(...)`, repitiendo la misma consulta en
varios archivos. Un cambio de proveedor de base de datos, o simplemente
agregar una validación al crear un paciente, obligaría a tocar cada lugar
donde se repitió esa consulta (el smell *Divergent Change* / *Shotgun
Surgery* del catálogo de refactoring.guru).

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

### 3.3 Factory Method

**Intención.** Definir una interfaz para crear un objeto, pero dejar que
una función/clase decida qué variante concreta construir, evitando
condicionales repetidos por tipo.

**Problema en este proyecto.** Los tres documentos (justificante, constancia,
permiso escolar) comparten el mismo membrete, tipografía y pie de página; lo
único que cambia es el título y los párrafos del cuerpo. Sin este patrón,
`generateDocumentPdf` tendría un `if/else` gigante mezclando maquetado
(posiciones, fuentes, colores) con el texto de cada tipo de documento — el
smell *Switch Statements* de refactoring.guru, que crece cada vez que se
agrega un nuevo tipo de documento.

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
ni el pie de página ya probados; el acabado visual queda garantizado
idéntico entre los tres tipos porque comparten el mismo código de dibujo.

### 3.4 Strategy

**Intención.** Definir una familia de algoritmos intercambiables
(en este caso, canales de notificación) detrás de una interfaz común, de
forma que quien notifica no necesite saber por cuál canal se está enviando.

**Problema en este proyecto.** El cron de recordatorios y la ruta que marca
una cita como completada (para enviar la encuesta) ambos necesitan "avisarle
algo a alguien". Sin este patrón, cada uno tendría su propio
`if (canal === "email") ... else if (canal === "whatsapp") ...` — el mismo
smell *Switch Statements*, duplicado en dos lugares y que crecería con cada
canal nuevo (WhatsApp, SMS).

**Solución aplicada.** `NotificationChannel` es la interfaz
(`send(to, subject, message)`); `EmailChannel` la implementa con Resend hoy,
y `WhatsAppChannel` queda lista como implementación de referencia para
conectar un proveedor real. `NotificationService` solo conoce la interfaz.

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

**Consecuencias.** Agregar un canal real de WhatsApp/SMS es una clase nueva
que implemente `NotificationChannel` — cero cambios en el cron, en la ruta
de "finalizar cita", ni en ningún otro lugar que ya use
`NotificationService`.

### 3.5 Observer

**Intención.** Definir una dependencia uno-a-muchos entre objetos, de forma
que cuando uno cambia de estado, todos sus dependientes sean notificados
automáticamente, sin que el emisor conozca los detalles de cada uno.

**Problema en este proyecto.** Al guardar una encuesta post-sesión, pueden
pasar varias cosas independientes entre sí: si hay factor de riesgo, avisar
a la psicóloga; a futuro, recalcular estadísticas o tendencias de ánimo del
paciente. Sin este patrón, la ruta `POST /api/survey/[appointmentId]`
tendría que conocer y llamar directamente cada una de esas acciones — el
smell *Feature Envy*: una ruta de API haciendo trabajo que no le
corresponde.

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
cosas pasan después de guardarla; agregar un nuevo comportamiento (por
ejemplo, un observador que actualice un tablero de tendencias) es una clase
nueva suscrita, sin tocar la ruta ni los observadores existentes.

## 3.6 Diseño y animación

La interfaz evita a propósito los "tells" típicos de una página genérica de
IA (fondo crema + acento terracota, tarjetas idénticas con la misma sombra,
etiquetas en MAYÚSCULAS): usa un acento morado propio, tipografía Fraunces +
Inter, y en `src/components/StatsRow.tsx` una sola franja con divisores en
vez de cuatro tarjetas repetidas.

El movimiento (`framer-motion`) sigue el mismo principio que las librerías de
Emil Kowalski (Vaul, Sonner): un solo momento orquestado por vista —no
efectos por cada tarjeta— y solo responde a una acción de la persona (abrir,
confirmar, cambiar de paso). Los tokens compartidos están en
`src/lib/motion.ts`:

- `EASE_OUT_SOFT` — la curva de salida-rápida/llegada-suave de Vaul.
- `springSnappy` / `springGentle` — los springs de Sonner para botones y
  confirmaciones.
- `viewEnter` — la entrada única de una vista completa (login, franja de
  estadísticas).
- `stepVariants` — la transición entre pasos de la encuesta post-sesión.

`MotionConfig reducedMotion="user"` en `src/app/layout.tsx` respeta la
preferencia del sistema operativo de reducir el movimiento. El sistema de
notificaciones (`src/components/Toast.tsx`) es una implementación ligera
inspirada directamente en Sonner.

Ver el detalle de clases en [`diagrams/class-diagram.puml`](diagrams/class-diagram.puml)
y [`diagrams/patterns-diagram.puml`](diagrams/patterns-diagram.puml).

## 3.7 Refactorización

Cada patrón de la sección 3 responde a un "code smell" concreto (código
duplicado, `switch`/`if-else` repetidos, cambios que se dispersan por varios
archivos), siguiendo el vocabulario y la justificación de
[refactoring.guru/es/design-patterns](https://refactoring.guru/es/design-patterns)
y su catálogo de [code smells](https://refactoring.guru/es/refactoring/smells).
La tabla resumen — smell detectado, patrón que lo resuelve y archivo — está
en [`docs/refactorizacion.md`](docs/refactorizacion.md), junto con el mismo
ejemplo antes/después de Strategy documentado arriba, en el formato de
tabla comparativa.

## 4. Diagramas (PlantUML)

En `diagrams/` encontrarás tres archivos `.puml`:

- `class-diagram.puml` — clases del dominio (Doctor, Patient, Appointment,
  SessionNote, SessionSurvey, FinanceEntry, IssuedDocument) y servicios.
- `database-diagram.puml` — diagrama entidad-relación de las tablas en Supabase.
- `patterns-diagram.puml` — los 5 patrones de diseño aplicados y dónde viven en el código.

Para verlos, pega el contenido en <https://www.plantuml.com/plantuml/uml/> o
usa la extensión "PlantUML" de VS Code (requiere Java o el servidor en línea).

## 5. Modelo de datos

Ver [`db/schema.sql`](db/schema.sql) — incluye todas las tablas, índices,
restricciones (por ejemplo, `chk_business_hours` impide agendar fuera de
8:00–20:00) y las políticas de **Row Level Security**: cada psicóloga
(`doctor_id` / `auth.uid()`) solo puede ver y modificar sus propios datos.
Las rutas públicas (confirmar cita, responder encuesta) nunca usan RLS del
lado del cliente: pasan por API routes del servidor con la Service Role Key,
validan un token UUID impredecible y solo tocan la fila correspondiente.

`db/seed.sql` trae un par de pacientes de ejemplo para pruebas locales.

## 6. Puesta en marcha local

### Requisitos
- Node.js 18+
- Una cuenta gratuita de [Supabase](https://supabase.com)
- (Opcional para correo) una cuenta gratuita de [Resend](https://resend.com)

### Pasos

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno y completarlas (ver sección 7)
cp .env.example .env.local

# 3. Levantar el proyecto
npm run dev
```

Abre <http://localhost:3000>.

## 7. Despliegue en Vercel + Supabase

### 7.1 Crear el proyecto en Supabase
1. Crea un proyecto nuevo en [supabase.com](https://supabase.com).
2. En **SQL Editor**, pega y ejecuta el contenido completo de `db/schema.sql`.
3. En **Authentication → Users**, crea el usuario de la psicóloga (correo y
   contraseña) — es con esas credenciales que inicia sesión en la app.
4. (Opcional) Ejecuta `db/seed.sql` sustituyendo `<TU_USER_ID>` por el UUID
   del usuario recién creado, para tener pacientes de prueba.
5. En **Project Settings → API**, copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (¡mantenla secreta!)

### 7.2 Configurar Resend (para correos de confirmación/encuesta)
1. Crea una cuenta en [resend.com](https://resend.com) y verifica un dominio
   (o usa el remitente de pruebas que ofrecen).
2. Copia tu API key a `RESEND_API_KEY`.
3. Define `REMINDER_FROM_EMAIL` con el remitente que quieras mostrar.

### 7.3 Desplegar en Vercel
1. Sube este proyecto a un repositorio de GitHub.
2. En [vercel.com](https://vercel.com), **Add New Project** → importa el
   repositorio.
3. En **Environment Variables**, agrega todas las variables de `.env.example`
   (incluyendo `NEXT_PUBLIC_APP_URL` con tu dominio final de Vercel y un
   `CRON_SECRET` que tú inventes).
4. Despliega. `vercel.json` ya incluye la configuración del cron diario.

## 8. Recordatorios automáticos (cron)

`vercel.json` programa `GET /api/cron/reminders` todos los días a las
**14:00 UTC** (8:00 a.m. hora de Ciudad de México). La ruta:

1. Busca las citas del día que aún no tienen recordatorio enviado.
2. A cada paciente con correo registrado, le envía un enlace único
   `.../confirmar/<token>` donde puede confirmar su asistencia con un botón.
3. Registra el resultado en `reminder_logs` (para auditoría).

Vercel llama esta ruta con el header `Authorization: Bearer <CRON_SECRET>`;
la ruta rechaza cualquier otra solicitud.

## 9. Generación de PDFs

Desde **Documentos** en el panel, se elige el tipo de documento
(justificante, constancia o permiso escolar), el paciente, el periodo de
fechas y datos opcionales (diagnóstico, nota adicional). El servidor arma el
PDF con `pdf-lib` reutilizando siempre el mismo membrete morado con el
símbolo Ψ, cédulas profesionales y pie de página de confidencialidad, y lo
registra en `issued_documents` para tener trazabilidad de qué se emitió y
cuándo. El archivo se descarga directamente desde el navegador.

## 10. Encuesta post-sesión

Al marcar una cita como **"Finalizar y enviar encuesta"** desde la agenda:

1. La cita pasa a estatus `completada`.
2. Si el paciente tiene correo registrado, recibe un enlace a
   `/encuesta/<token>` (sin necesidad de cuenta).
3. Ahí responde, con botones simples, preguntas sobre su estado de ánimo,
   ansiedad, apertura en sesión y sueño; luego una escala de 1 a 10 de qué
   tan cerca está del alta; y finalmente si hay algún factor de riesgo que
   deba informarse a su contacto de emergencia.
4. Si marca que sí hay un factor de riesgo, el patrón Observer
   (`RiskAlertObserver`) dispara automáticamente un correo de alerta a la
   psicóloga (variable `DOCTOR_ALERT_EMAIL`).

## 11. Estructura de carpetas

```
consultorio-marina/
├── db/                     # schema.sql, seed.sql
├── diagrams/               # class-diagram.puml, database-diagram.puml, patterns-diagram.puml
├── docs/                   # refactorizacion.md (smells → patrón, ejemplo antes/después)
├── scripts/                # generate_quotes.py
├── src/
│   ├── app/
│   │   ├── page.tsx                     # Login
│   │   ├── dashboard/                   # Panel de la psicóloga (protegido)
│   │   ├── confirmar/[token]/           # Confirmación pública de cita
│   │   ├── encuesta/[appointmentId]/    # Encuesta pública post-sesión
│   │   └── api/                         # Route handlers (patients, appointments, pdf, cron, confirm, survey, finance)
│   ├── components/                      # Componentes de cliente reutilizables
│   ├── lib/
│   │   ├── supabase/                    # Clientes (Singleton)
│   │   ├── repositories/                # Repository
│   │   ├── patterns/                    # Strategy, Observer
│   │   ├── pdf/                         # Factory Method
│   │   ├── services/                    # Estadísticas
│   │   ├── utils/                       # Horarios/slots
│   │   └── quotes.ts / quotes.json      # 500 frases motivadoras
│   └── types/                           # Tipos compartidos
├── vercel.json             # Configuración del cron diario
└── .env.example
```

## 12. Roadmap / siguientes pasos

- Autenticación multi-psicóloga con roles (hoy soporta una o varias
  psicólogas mediante `doctor_id`, pero la UI está pensada para una sola).
- Canal de WhatsApp/SMS real conectando `WhatsAppChannel` a un proveedor
  (Twilio, Meta Cloud API) — la interfaz `NotificationChannel` ya está lista.
- Exportar el expediente completo de un paciente a PDF.
- Notificaciones push en el navegador para citas próximas.
