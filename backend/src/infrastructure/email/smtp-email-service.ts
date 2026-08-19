import type {
  EmailService,
  InitialCredentialsEmail,
} from '../../application/services/EmailService.js';

export interface SmtpTransporter {
  sendMail(input: {
    from: string;
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<unknown>;
}

export class SmtpEmailService implements EmailService {
  constructor(
    private readonly transporter: SmtpTransporter,
    private readonly from: string,
  ) {}

  isAvailable(): boolean {
    return true;
  }

  async sendInitialCredentials(email: InitialCredentialsEmail): Promise<void> {
    const { recipientEmail, recipientFirstName, temporaryPassword } = email;

    await this.transporter.sendMail({
      from: this.from,
      to: recipientEmail,
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
