import assert from 'node:assert/strict';
import test from 'node:test';

import { createEmailService } from '../src/infrastructure/config/email-service-factory.js';
import { SmtpEmailService } from '../src/infrastructure/email/smtp-email-service.js';

const smtpEnvironmentNames = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_SECURE',
  'SMTP_USER',
  'SMTP_APP_PASSWORD',
  'EMAIL_FROM',
] as const;

function withSmtpEnvironment(
  values: Record<(typeof smtpEnvironmentNames)[number], string | undefined>,
  callback: () => void,
): void {
  const previousValues = Object.fromEntries(
    smtpEnvironmentNames.map((name) => [name, process.env[name]]),
  ) as Record<(typeof smtpEnvironmentNames)[number], string | undefined>;

  try {
    for (const name of smtpEnvironmentNames) {
      const value = values[name];
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }

    callback();
  } finally {
    for (const name of smtpEnvironmentNames) {
      const value = previousValues[name];
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}

test('email service factory fails safely when required SMTP configuration is missing', () => {
  withSmtpEnvironment({
    SMTP_HOST: undefined,
    SMTP_PORT: '465',
    SMTP_SECURE: 'true',
    SMTP_USER: 'project@example.com',
    SMTP_APP_PASSWORD: 'test-app-password',
    EMAIL_FROM: 'CicloViento <project@example.com>',
  }, () => {
    assert.throws(() => createEmailService(), /SMTP_HOST is required/);
  });
});

test('email service factory activates SMTP with valid environment configuration', () => {
  withSmtpEnvironment({
    SMTP_HOST: 'smtp.gmail.com',
    SMTP_PORT: '465',
    SMTP_SECURE: 'true',
    SMTP_USER: 'project@example.com',
    SMTP_APP_PASSWORD: 'test-app-password',
    EMAIL_FROM: 'CicloViento <project@example.com>',
  }, () => {
    assert.ok(createEmailService() instanceof SmtpEmailService);
  });
});
