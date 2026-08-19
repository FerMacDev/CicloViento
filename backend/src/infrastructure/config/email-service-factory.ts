import 'dotenv/config';
import nodemailer from 'nodemailer';

import type { EmailService } from '../../application/services/EmailService.js';
import { SmtpEmailService } from '../email/smtp-email-service.js';

export function createEmailService(): EmailService {
  const host = requireEnvironmentValue('SMTP_HOST');
  const port = parsePort(requireEnvironmentValue('SMTP_PORT'));
  const secure = parseBoolean(requireEnvironmentValue('SMTP_SECURE'), 'SMTP_SECURE');
  const user = requireEnvironmentValue('SMTP_USER');
  const password = requireEnvironmentValue('SMTP_APP_PASSWORD');
  const from = requireEnvironmentValue('EMAIL_FROM');

  return new SmtpEmailService(
    nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass: password },
    }),
    from,
  );
}

function requireEnvironmentValue(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`SMTP configuration error: ${name} is required.`);
  }

  return value;
}

function parsePort(value: string): number {
  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('SMTP configuration error: SMTP_PORT must be an integer between 1 and 65535.');
  }

  return port;
}

function parseBoolean(value: string, name: string): boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;

  throw new Error(`SMTP configuration error: ${name} must be true or false.`);
}
