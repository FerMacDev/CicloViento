import type { GeneratedRoute } from './RoutingService.js';

export interface GpxGenerator {
  generate(input: { route: GeneratedRoute; name: string; createdAt: Date }): string;
}

export class GpxGenerationError extends Error {
  constructor() {
    super('A GPX file could not be generated for this route.');
    this.name = 'GpxGenerationError';
  }
}

export class XmlGpxGenerator implements GpxGenerator {
  generate({ route, name, createdAt }: { route: GeneratedRoute; name: string; createdAt: Date }): string {
    if (route.geometry.length === 0 || !route.geometry.every(isValidCoordinate) || Number.isNaN(createdAt.getTime())) {
      throw new GpxGenerationError();
    }

    const trackPoints = route.geometry
      .map(({ latitude, longitude }) => `      <trkpt lat="${latitude}" lon="${longitude}"></trkpt>`)
      .join('\n');
    const escapedName = escapeXml(name);

    return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="CicloViento" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${escapedName}</name>
    <time>${createdAt.toISOString()}</time>
    <desc>Ruta generada por CicloViento</desc>
  </metadata>
  <trk>
    <name>${escapedName}</name>
    <trkseg>
${trackPoints}
    </trkseg>
  </trk>
</gpx>`;
  }
}

export function createGpxFilename(startLocation: string, date: string): string {
  const normalizedLocation = startLocation
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const safeDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : 'ruta';
  return `cicloviento-${normalizedLocation || 'ruta'}-${safeDate}.gpx`;
}

export function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character] as string);
}

function isValidCoordinate(coordinate: { latitude: number; longitude: number }): boolean {
  return Number.isFinite(coordinate.latitude)
    && Number.isFinite(coordinate.longitude)
    && coordinate.latitude >= -90
    && coordinate.latitude <= 90
    && coordinate.longitude >= -180
    && coordinate.longitude <= 180;
}
