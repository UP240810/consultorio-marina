import { Resend } from "resend";

export interface NotificationChannel {
  send(to: string, subject: string, message: string): Promise<void>;
}

export class EmailChannel implements NotificationChannel {
  private resend: Resend;
  constructor(apiKey: string = process.env.RESEND_API_KEY!) {
    this.resend = new Resend(apiKey);
  }

  async send(to: string, subject: string, message: string): Promise<void> {
    await this.resend.emails.send({
      from: process.env.REMINDER_FROM_EMAIL || "Consultorio <onboarding@resend.dev>",
      to,
      subject,
      html: message,
    });
  }
}

export class WhatsAppChannel implements NotificationChannel {
  async send(to: string, _subject: string, message: string): Promise<void> {
    console.warn(
      `[WhatsAppChannel] No configurado todavía. Mensaje pendiente para ${to}: ${message}`
    );
  }
}

export class NotificationService {
  constructor(private channel: NotificationChannel) {}

  setChannel(channel: NotificationChannel) {
    this.channel = channel;
  }

  async notify(to: string, subject: string, message: string): Promise<void> {
    await this.channel.send(to, subject, message);
  }
}
