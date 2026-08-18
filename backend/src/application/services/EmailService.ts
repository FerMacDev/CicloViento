export interface InitialCredentialsEmail {
  recipientEmail: string;
  recipientFirstName: string;
  temporaryPassword: string;
}

export interface EmailService {
  isAvailable(): boolean;
  sendInitialCredentials(email: InitialCredentialsEmail): Promise<void>;
}
