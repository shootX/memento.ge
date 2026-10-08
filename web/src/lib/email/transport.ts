import nodemailer from "nodemailer";
import { Resend } from "resend";
import type { EmailLocale } from "@/lib/email/templates";
import { maskEmail, redactSensitiveText } from "@/lib/safe-log";

export type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type MailTransport = {
  send(input: SendMailInput): Promise<void>;
};

class LogTransport implements MailTransport {
  async send(input: SendMailInput): Promise<void> {
    console.info(
      "[email:log]",
      maskEmail(input.to),
      input.subject,
      redactSensitiveText(input.text.slice(0, 160)),
    );
  }
}

class SmtpTransport implements MailTransport {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? "127.0.0.1",
      port: Number(process.env.SMTP_PORT ?? 1025),
      secure: process.env.SMTP_SECURE === "1",
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
    });
  }

  async send(input: SendMailInput): Promise<void> {
    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM ?? "Memento <hello@memento.ge>",
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
  }
}

class ResendTransport implements MailTransport {
  private client: Resend;

  constructor() {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY missing");
    this.client = new Resend(key);
  }

  async send(input: SendMailInput): Promise<void> {
    const from = process.env.EMAIL_FROM ?? "Memento <hello@memento.ge>";
    const { error } = await this.client.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    if (error) throw new Error(error.message);
  }
}

let cached: MailTransport | null = null;

export function getMailTransport(): MailTransport {
  if (cached) return cached;
  const mode = (process.env.EMAIL_PROVIDER ?? "log").toLowerCase();
  if (mode === "smtp") cached = new SmtpTransport();
  else if (mode === "resend") cached = new ResendTransport();
  else cached = new LogTransport();
  return cached;
}

export function resetMailTransportForTests() {
  cached = null;
}

export function parseLocale(raw: string | undefined): EmailLocale {
  if (raw === "en" || raw === "ru" || raw === "ka") return raw;
  return "ka";
}

export function setTransportForTests(t: MailTransport) {
  cached = t;
}
