import type {
  EmailService,
  InitialCredentialsEmail,
} from '../../application/services/EmailService.js';

export class UnavailableEmailService implements EmailService {
  isAvailable(): boolean {
    return false;
  }

  async sendInitialCredentials(_email: InitialCredentialsEmail): Promise<void> {
    throw new Error('Email delivery is not configured.');
  }
}
