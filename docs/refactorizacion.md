# Refactorización

Referencia usada para el vocabulario y la justificación de cada patrón:
[refactoring.guru/es/design-patterns](https://refactoring.guru/es/design-patterns)
y su catálogo de [code smells](https://refactoring.guru/es/refactoring/smells).

Refactorizar es reestructurar código existente **sin cambiar su
comportamiento externo**, para hacerlo más fácil de entender y de extender.
No se hace por hacer: cada patrón de este proyecto responde a un "code
smell" concreto que existía (o habría existido) en una primera versión más
ingenua del código.

## 1. Mapa de code smells → patrón aplicado

| Code smell (refactoring.guru) | Sin refactorizar | Patrón aplicado | Archivo |
|---|---|---|---|
| **Duplicated Code** — la misma lógica de conexión a Supabase repetida en cada archivo | Cada componente/ruta crea su propio `createClient(...)` | **Singleton** | `src/lib/supabase/client.ts`, `server.ts` |
| **Divergent Change** — el acceso a datos de pacientes cambia por razones ajenas a la UI (ej. cambiar de Supabase a otra BD obligaría a tocar cada página) | Las páginas llaman `supabase.from("patients")...` directamente | **Repository** | `src/lib/repositories/*.ts` |
| **Switch Statements / Repeated Conditionals** — un `if/else` por tipo de documento repetido en cada lugar que genera un PDF | Un solo generador con `if (type === "justificante") {...} else if (type === "constancia") {...}` mezclando maquetado y contenido | **Factory Method** | `src/lib/pdf/DocumentTemplateFactory.ts` |
| **Switch Statements** sobre el canal de envío | `if (channel === "email") sendEmail(); else if (channel === "whatsapp") sendWhatsApp();` repetido en el cron y en la encuesta | **Strategy** | `src/lib/patterns/NotificationStrategy.ts` |
| **Feature Envy / Shotgun Surgery** — la ruta de la encuesta tendría que conocer y llamar directamente la lógica de alertas de riesgo, estadísticas, etc. | Toda la lógica posterior a guardar la encuesta viviría dentro de la misma ruta API | **Observer** | `src/lib/patterns/SurveyObserver.ts` |

## 2. Ejemplo concreto: de "Switch Statements" a Strategy

**Antes** (el smell que refactoring.guru llama *Switch Statements*: la misma
decisión por tipo de canal repetida en más de un lugar, y que crece cada vez
que se agrega un canal nuevo):

```ts
// cron/reminders (antes de refactorizar)
async function enviarRecordatorio(paciente, mensaje, canal: string) {
  if (canal === "email") {
    await resend.emails.send({ to: paciente.email, html: mensaje /* ... */ });
  } else if (canal === "whatsapp") {
    await twilioClient.messages.create({ to: paciente.telefono, body: mensaje });
  } else if (canal === "sms") {
    await twilioClient.messages.create({ to: paciente.telefono, body: mensaje });
  }
  // cada canal nuevo obliga a tocar esta función Y la de la encuesta,
  // que tiene el mismo if/else duplicado.
}
```

**Después** (patrón **Strategy**, `src/lib/patterns/NotificationStrategy.ts`):

```ts
export interface NotificationChannel {
  send(to: string, subject: string, message: string): Promise<void>;
}

export class EmailChannel implements NotificationChannel { /* ... */ }
export class WhatsAppChannel implements NotificationChannel { /* ... */ }

export class NotificationService {
  constructor(private channel: NotificationChannel) {}
  setChannel(channel: NotificationChannel) { this.channel = channel; }
  async notify(to: string, subject: string, message: string) {
    await this.channel.send(to, subject, message);
  }
}
```

Quien usa el servicio ya no pregunta "¿qué canal es?"; simplemente le pide
que notifique:

```ts
const notifier = new NotificationService(new EmailChannel());
await notifier.notify(paciente.email, "Confirma tu cita", mensaje);
```

Agregar SMS real mañana significa **una clase nueva** que implemente
`NotificationChannel` — cero cambios en el cron, la encuesta, ni ningún otro
lugar que ya use `NotificationService`. Ese es el beneficio que
refactoring.guru describe para Strategy: cambiar un algoritmo en tiempo de
ejecución sin condicionales dispersos por el código.

## 3. Por qué esto cuenta como refactorización y no solo como diseño

Los 5 patrones de este proyecto (ver
[`diagrams/patterns-diagram.puml`](../diagrams/patterns-diagram.puml)) no se
eligieron por catálogo, sino como respuesta a un smell concreto de la tabla
de arriba. Es la misma idea que refactoring.guru resume en su sección de
[por qué refactorizar](https://refactoring.guru/es/refactoring/what-is-refactoring):
el código sigue haciendo lo mismo desde afuera, pero por dentro queda más
fácil de extender (nuevo canal, nuevo tipo de documento, nuevo observador de
la encuesta) sin tocar el código que ya funciona.
