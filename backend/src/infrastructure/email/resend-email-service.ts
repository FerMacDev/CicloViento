import type {
  EmailService,
  InitialCredentialsEmail,
} from '../../application/services/EmailService.js';

interface ResendSendInput {
  from: string;
  to: string[];
  subject: string;
  text: string;
  html: string;
}

export interface ResendEmailClient {
  emails: {
    send(input: ResendSendInput): Promise<{ error: unknown | null }>;
  };
}

export class ResendEmailService implements EmailService {
  constructor(
    private readonly resend: ResendEmailClient,
    private readonly from: string,
  ) {}

  isAvailable(): boolean {
    return true;
  }

  async sendInitialCredentials(email: InitialCredentialsEmail): Promise<void> {
    const { recipientEmail, recipientFirstName, temporaryPassword } = email;
    const result = await this.resend.emails.send({
      from: this.from,
      to: [recipientEmail],
      subject: 'Bienvenido a CicloViento',
      text: [
        `Hola ${recipientFirstName},`,
        '',
        'Te damos la bienvenida a CicloViento.',
        `Email de acceso: ${recipientEmail}`,
        `Contraseña temporal: ${temporaryPassword}`,
        '',
        'Deberás cambiar esta contraseña cuando realices tu primer acceso.',
      ].join('\n'),
      html: `<p>Hola ${this.escapeHtml(recipientFirstName)},</p><p>Te damos la bienvenida a <strong>CicloViento</strong>.</p><p><strong>Email de acceso:</strong> ${this.escapeHtml(recipientEmail)}<br><strong>Contraseña temporal:</strong> ${this.escapeHtml(temporaryPassword)}</p><p>Deberás cambiar esta contraseña cuando realices tu primer acceso.</p>`,
    });

    if (result.error) {
      throw new Error('Resend could not deliver the initial credentials.');
    }
  }

  private escapeHtml(value: string): string {
    return value.replace(/[&<>'"]/g, (character) => {
      const entities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
      };

      return entities[character];
    });
  }
}
