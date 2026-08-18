import 'dotenv/config';
import { Resend } from 'resend';

import type { EmailService } from '../../application/services/EmailService.js';
import { ResendEmailService } from '../email/resend-email-service.js';
import { UnavailableEmailService } from '../email/unavailable-email-service.js';

export function createEmailService(): EmailService {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    return new UnavailableEmailService();
  }

  return new ResendEmailService(new Resend(apiKey), from);
}
