/** Technical example only; it is not a CicloViento business entity. */
export class HealthCheck {
  private constructor(public readonly status: 'ok') {}

  static healthy(): HealthCheck {
    return new HealthCheck('ok');
  }
}
