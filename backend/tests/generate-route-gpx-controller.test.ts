import assert from 'node:assert/strict';
import test from 'node:test';

import { GenerateRouteGpxController } from '../src/presentation/controllers/generate-route-gpx-controller.js';
import { RoutePlanNotFoundError } from '../src/application/use-cases/GenerateCyclingRouteUseCase.js';

function response() {
  let statusCode: number | undefined;
  let body: unknown;
  const headers = new Map<string, string>();
  const value = {
    status: (code: number) => { statusCode = code; return value; },
    setHeader: (name: string, headerValue: string) => headers.set(name, headerValue),
    send: (payload: unknown) => { body = payload; },
    json: (payload: unknown) => { body = payload; },
  };
  return { value, headers, get statusCode() { return statusCode; }, get body() { return body; } };
}

test('GPX controller sets download headers and sends GPX content', async () => {
  const controller = new GenerateRouteGpxController({ execute: async () => ({ filename: 'cicloviento-ruta-2026-08-25.gpx', content: '<?xml version="1.0"?><gpx />' }) } as never);
  const res = response();
  await controller.handle({ params: { id: 'plan' }, authenticatedUser: { userId: 'user' } } as never, res.value as never, () => {});
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers.get('Content-Type'), 'application/gpx+xml; charset=utf-8');
  assert.match(res.headers.get('Content-Disposition') ?? '', /attachment; filename=".*\.gpx"/);
  assert.match(String(res.body), /<gpx/);
});

test('GPX controller maps an unavailable route plan to the shared 404 response', async () => {
  const controller = new GenerateRouteGpxController({ execute: async () => { throw new RoutePlanNotFoundError(); } } as never);
  const res = response();
  await controller.handle({ params: { id: 'plan' }, authenticatedUser: { userId: 'user' } } as never, res.value as never, () => {});
  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { message: 'Planificación no encontrada.' });
});
