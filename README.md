# Consultorio Marina Velázquez Tristán

Sistema de gestión para un consultorio de psicología, construido como
aplicación web completa conectada a una base de datos real, siguiendo los
fundamentos de la Programación Orientada a Objetos y documentado con
diagramas UML en formato `.puml`.

Stack: **Next.js 14 (TypeScript) + Supabase (PostgreSQL) + Vercel**.

---

## Índice

1. [Qué es la aplicación](#1-qué-es-la-aplicación)
2. [Por qué está construida bajo Programación Orientada a Objetos](#2-por-qué-está-construida-bajo-programación-orientada-a-objetos)
3. [Base de datos: cuál se usa y cómo se conecta la aplicación](#3-base-de-datos-cuál-se-usa-y-cómo-se-conecta-la-aplicación)
4. [Diagramas UML (.puml)](#4-diagramas-uml-puml)
5. [Funcionalidad: qué hace la aplicación de principio a fin](#5-funcionalidad-qué-hace-la-aplicación-de-principio-a-fin)
6. [Puesta en marcha](#6-puesta-en-marcha)
7. [Estructura del repositorio](#7-estructura-del-repositorio)

---

## 1. Qué es la aplicación

Es el sistema de administración diaria del consultorio de la Psic. Marina
Velázquez Tristán (Psicología Cognitivo-Conductual y Terapia Gestalt). Antes
de este sistema, la agenda, los expedientes y los documentos que se emiten
(justificantes, constancias, permisos escolares) se llevaban por separado y
a mano; la aplicación los unifica en un solo lugar con datos reales
persistidos en una base de datos, no en memoria ni en archivos sueltos.

Concretamente, resuelve cuatro necesidades del consultorio:

- **Agenda clínica**: horario fijo de 8:00 a.m. a 8:00 p.m. en franjas de 50
  minutos, con las citas realmente guardadas en base de datos y consultables
  por día.
- **Expediente de paciente**: datos personales, contacto de emergencia,
  medicación actual y una bitácora de notas de sesión por paciente.
- **Ciclo de vida de una consulta**: se agenda, se envía un recordatorio con
  enlace de confirmación, se atiende, se marca como finalizada y se envía
  una encuesta post-sesión (con una pregunta explícita de factor de riesgo
  para el contacto de emergencia).
- **Emisión de documentos**: generación de PDFs (justificante, constancia,
  permiso escolar) a partir de un formulario, con el membrete y las cédulas
  profesionales reales de la psicóloga.

## 2. Por qué está construida bajo Programación Orientada a Objetos

El proyecto no es un CRUD suelto de páginas hablando directo con la base de
datos: está organizado en **clases con responsabilidad única**, que se
comunican mediante **interfaces** (abstracción y polimorfismo) en vez de
depender unas de otras directamente. Esa organización es, en sí misma, la
base de Programación Orientada a Objetos que pide el proyecto, y se ve en
tres niveles:

**a) El modelo de dominio.** Las entidades reales del consultorio —
`Patient`, `Appointment`, `SessionNote`, `SessionSurvey`, `FinanceEntry`,
`IssuedDocument` — están definidas como tipos/clases de dominio con sus
propios atributos y reglas (ver `diagrams/class-diagram.puml`), no como
filas de tabla sueltas manipuladas donde sea.

**b) Encapsulamiento del acceso a datos (patrón Repository).** Ninguna
página le pregunta directamente a la base de datos. `SupabasePatientRepository`
y `SupabaseAppointmentRepository` son las únicas clases que saben que la
base de datos es Supabase; el resto del sistema solo conoce la interfaz
(`IPatientRepository`, `IAppointmentRepository`). Esto es encapsulamiento:
el "cómo se guarda" queda oculto detrás del "qué se puede hacer".

**c) Polimorfismo mediante interfaces (patrones Strategy, Factory Method,
Observer).** Tres problemas del consultorio se resolvieron dejando que una
interfaz común tenga varias implementaciones intercambiables, en vez de un
`if/else` gigante repetido:

| Patrón | Interfaz | Implementaciones concretas | Problema real que resuelve |
|---|---|---|---|
| **Singleton** | — | `getSupabaseBrowserClient()`, `getSupabaseAdminClient()` | Una sola instancia del cliente de base de datos, en vez de recrearlo en cada archivo. |
| **Repository** | `IPatientRepository`, `IAppointmentRepository` | `SupabasePatientRepository`, `SupabaseAppointmentRepository` | El resto de la app nunca depende de cómo está guardada la información. |
| **Factory Method** | `DocumentTemplate` (construcción) | Justificante / Constancia / Permiso escolar | Los tres PDFs comparten membrete y firma; solo cambia el cuerpo según el tipo. |
| **Strategy** | `NotificationChannel` | `EmailChannel`, `WhatsAppChannel` | El recordatorio diario y la alerta de riesgo notifican sin saber por qué canal. |
| **Observer** | `SurveyObserver` | `RiskAlertObserver`, `StatisticsObserver` | Guardar una encuesta puede disparar varias reacciones independientes (alerta de riesgo, estadísticas) sin acoplarlas al formulario. |

Cada uno de estos cinco patrones está documentado a detalle —intención,
problema, solución y consecuencias, con el código real del proyecto— en
[`docs/patrones-de-diseno.md`](docs/patrones-de-diseno.md), incluyendo el
mapa de "code smells" que cada patrón resuelve (referencia:
[refactoring.guru/es/design-patterns](https://refactoring.guru/es/design-patterns)).
El diagrama completo de estas relaciones está en
[`diagrams/patterns-diagram.puml`](diagrams/patterns-diagram.puml).

## 3. Base de datos: cuál se usa y cómo se conecta la aplicación

**Motor:** PostgreSQL, administrado a través de **Supabase** (Backend-as-a-
-Service sobre Postgres que además provee autenticación y seguridad a nivel
de fila). Se eligió porque da, en un mismo proyecto, la base de datos
relacional, el login de la psicóloga y las políticas de seguridad, sin
necesidad de un servidor propio.

**Cómo se conecta la aplicación:**

1. El esquema completo (tablas, llaves foráneas, restricciones e índices)
   vive en [`db/schema.sql`](db/schema.sql) y se ejecuta una sola vez desde
   el SQL Editor de Supabase para crear la base de datos.
2. La aplicación nunca usa una contraseña de base de datos directamente:
   se conecta con las librerías oficiales `@supabase/supabase-js` y
   `@supabase/ssr`, autenticadas con dos llaves distintas según el
   contexto:
   - **Llave pública (`anon key`)**: usada por el navegador y por las
     páginas del panel de la psicóloga, sujeta a **Row Level Security**
     (cada fila de `patients`, `appointments`, etc. solo es visible para
     el `doctor_id` que le corresponde — ver las políticas al final de
     `db/schema.sql`).
   - **Llave de servicio (`service_role key`)**: usada solo por rutas de
     servidor sin sesión de usuario (confirmar cita por token, responder
     la encuesta, el cron de recordatorios), porque ahí no hay una
     psicóloga autenticada, pero la ruta valida un token UUID
     impredecible antes de tocar cualquier fila.
3. Ambas conexiones están centralizadas con el patrón Singleton en
   `src/lib/supabase/client.ts` (navegador) y `src/lib/supabase/server.ts`
   (servidor), así que ningún otro archivo abre su propia conexión.
4. Las variables `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   y `SUPABASE_SERVICE_ROLE_KEY` (ver `.env.example`) son lo único que hay
   que configurar para apuntar la aplicación a un proyecto de Supabase
   distinto — no hay cadenas de conexión ni SQL crudo dentro del código de
   la aplicación, todo pasa por los repositorios.

## 4. Diagramas UML (.puml)

Los tres diagramas requeridos están en `diagrams/`, en formato PlantUML
(`.puml`), y se pueden abrir pegando su contenido en
<https://www.plantuml.com/plantuml/uml/> o con la extensión "PlantUML" de
VS Code:

- **`class-diagram.puml`** — Diagrama de clases: las entidades del dominio
  (`Doctor`, `Patient`, `Appointment`, `SessionNote`, `SessionSurvey`,
  `FinanceEntry`, `IssuedDocument`), sus atributos, sus enumeraciones de
  estado, y los servicios de aplicación (`AppointmentScheduler`,
  `SurveyService`, `DocumentGenerator`, `NotificationService`,
  `StatisticsService`) con sus relaciones.
- **`database-diagram.puml`** — Diagrama entidad-relación de las tablas
  reales creadas en Supabase (`patients`, `appointments`, `session_notes`,
  `session_surveys`, `finance_entries`, `issued_documents`,
  `reminder_logs`) y sus llaves foráneas hacia `auth.users`.
- **`patterns-diagram.puml`** — Diagrama de los 5 patrones de diseño
  aplicados (Singleton, Repository, Factory Method, Strategy, Observer):
  cada interfaz, sus implementaciones concretas, y en qué archivo vive
  cada una.

## 5. Funcionalidad: qué hace la aplicación de principio a fin

Para comprobar que el sistema es funcional y no solo un diseño en papel,
este es el recorrido completo, en el orden en que ocurre en la vida real
del consultorio:

1. La psicóloga inicia sesión (Supabase Auth) y agenda una cita para un
   paciente en un horario libre entre 8:00 y 20:00 — la restricción de
   horario está reforzada tanto en la interfaz como en la base de datos
   (`chk_business_hours` en `schema.sql`).
2. Un proceso programado (`vercel.json` + `/api/cron/reminders`) revisa
   diariamente las citas del día y envía por correo, a cada paciente, un
   enlace único para confirmar su asistencia sin necesidad de cuenta.
3. Al terminar la consulta, la psicóloga la marca como completada; el
   sistema envía automáticamente el enlace de la encuesta post-sesión.
4. El paciente responde la encuesta con botones simples; si señala un
   factor de riesgo, el sistema alerta automáticamente a la psicóloga
   (patrón Observer).
5. La psicóloga puede, en cualquier momento, generar un PDF (justificante,
   constancia o permiso escolar) para ese paciente, y consultar las
   estadísticas de ingresos, gastos y citas del mes.

Todo lo anterior lee y escribe contra la base de datos real descrita en la
sección 3 — no hay datos simulados en el código de producción.

## 6. Puesta en marcha

Los pasos detallados para instalar dependencias, crear el proyecto de
Supabase, ejecutar `db/schema.sql`, configurar las variables de entorno y
desplegar en Vercel están documentados, paso a paso, en
[`docs/instrucciones_ejecucion.txt`](docs/instrucciones_ejecucion.txt).

Resumen rápido para desarrollo local (con el proyecto de Supabase y las
variables de entorno ya configuradas, ver el archivo anterior):

```bash
npm install
cp .env.example .env.local   # completar con las llaves de Supabase/Resend
npm run dev
```

## 7. Estructura del repositorio

```
consultorio-marina/
├── db/schema.sql              # Esquema de la base de datos (PostgreSQL/Supabase)
├── diagrams/                  # class-diagram.puml, database-diagram.puml, patterns-diagram.puml
├── docs/
│   ├── patrones-de-diseno.md      # Documentación detallada de cada patrón (POO)
│   └── instrucciones_ejecucion.txt # Guía paso a paso para ejecutar el proyecto
├── src/
│   ├── app/                   # Páginas y rutas API (Next.js App Router)
│   ├── lib/
│   │   ├── supabase/          # Conexión a la base de datos (Singleton)
│   │   ├── repositories/      # Acceso a datos por entidad (Repository)
│   │   ├── patterns/          # Strategy, Observer
│   │   └── pdf/               # Factory Method
│   └── types/                 # Modelo de dominio (clases/tipos)
└── .env.example
```
