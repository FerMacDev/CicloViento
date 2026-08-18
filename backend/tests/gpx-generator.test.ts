import assert from 'node:assert/strict';
import test from 'node:test';

import { createGpxFilename, GpxGenerationError, XmlGpxGenerator } from '../src/application/services/GpxGenerator.js';

const route = {
  start: { latitude: 40.48, longitude: -3.36 },
  geometry: [{ latitude: 40.48, longitude: -3.36 }, { latitude: 40.49, longitude: -3.35 }],
  distanceM: 2_000,
  durationS: 300,
};

test('XmlGpxGenerator creates a valid GPX 1.1 track preserving point order and coordinates', () => {
  const gpx = new XmlGpxGenerator().generate({ route, name: 'CicloViento - Alcalá', createdAt: new Date('2026-08-25T10:00:00.000Z') });
  assert.match(gpx, /<gpx version="1.1" creator="CicloViento" xmlns="http:\/\/www\.topografix\.com\/GPX\/1\/1">/);
  assert.equal((gpx.match(/<trkpt /g) ?? []).length, route.geometry.length);
  assert.ok(gpx.indexOf('lat="40.48" lon="-3.36"') < gpx.indexOf('lat="40.49" lon="-3.35"'));
  assert.match(gpx, /<trkseg>/);
});

test('XmlGpxGenerator escapes XML text and uses a filesystem-safe filename', () => {
  const gpx = new XmlGpxGenerator().generate({ route, name: 'A & B <Ruta> "especial"', createdAt: new Date('2026-08-25T10:00:00.000Z') });
  assert.match(gpx, /A &amp; B &lt;Ruta&gt; &quot;especial&quot;/);
  assert.equal(createGpxFilename('Alcalá de Henares / ../../', '2026-08-25'), 'cicloviento-alcala-de-henares-2026-08-25.gpx');
  assert.equal(createGpxFilename('../../', 'not-a-date'), 'cicloviento-ruta-ruta.gpx');
});

test('XmlGpxGenerator rejects empty or invalid geometries', () => {
  const generator = new XmlGpxGenerator();
  assert.throws(() => generator.generate({ route: { ...route, geometry: [] }, name: 'Ruta', createdAt: new Date() }), GpxGenerationError);
  assert.throws(() => generator.generate({ route: { ...route, geometry: [{ latitude: 91, longitude: 0 }] }, name: 'Ruta', createdAt: new Date() }), GpxGenerationError);
});
