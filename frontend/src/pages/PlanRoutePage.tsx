import { type FormEvent, useState } from "react";
import { ApiError } from "../services/api-client";
import { useAuth } from "../hooks/useAuth";
import type {
  GeneratedRouteResponse,
  RoutePlanResponse,
  RouteWeatherResponse,
  WindAnalysisResponse,
} from "../types/route-plan";
import { StartLocationMap } from "../components/StartLocationMap";

function weatherCondition(weatherCode: number): { icon: string; label: string } {
  if (weatherCode === 0) return { icon: "☀️", label: "Despejado" };
  if ([1, 2].includes(weatherCode)) return { icon: "⛅", label: "Parcialmente nublado" };
  if (weatherCode === 3) return { icon: "☁️", label: "Nublado" };
  if ([45, 48].includes(weatherCode)) return { icon: "🌫️", label: "Niebla" };
  if ([51, 53, 55, 56, 57].includes(weatherCode)) return { icon: "🌦️", label: "Llovizna" };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) return { icon: "🌧️", label: "Lluvia" };
  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) return { icon: "❄️", label: "Nieve" };
  if ([95, 96, 99].includes(weatherCode)) return { icon: "⛈️", label: "Tormenta" };
  return { icon: "🌤️", label: "Condiciones variables" };
}

export function PlanRoutePage() {
  const { createRoutePlan, generateCyclingRoute, getRouteWeather, analyzeRouteWind, downloadRouteGpx } = useAuth();
  const [form, setForm] = useState({
    startLocation: "",
    date: "",
    distanceKm: 80,
    elevationGainM: 700,
    favorableWind: false,
  });
  const [result, setResult] = useState<RoutePlanResponse | null>(null);
  const [route, setRoute] = useState<GeneratedRouteResponse | null>(null);
  const [weather, setWeather] = useState<RouteWeatherResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [windAnalysis, setWindAnalysis] = useState<WindAnalysisResponse | null>(null);
  const [analyzingWind, setAnalyzingWind] = useState(false);
  const [downloadingGpx, setDownloadingGpx] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (
      !form.startLocation.trim() ||
      !form.date ||
      form.distanceKm < 10 ||
      form.distanceKm > 300 ||
      form.elevationGainM < 0 ||
      form.elevationGainM > 5000
    ) {
      setError(
        "Revisa los datos: distancia entre 10 y 300 km y desnivel entre 0 y 5.000 m.",
      );
      return;
    }
    setLoading(true);
    setError("");
    try {
      setResult(
        await createRoutePlan({
          ...form,
          startLocation: form.startLocation.trim(),
        }),
      );
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : "No se ha podido guardar la planificación.",
      );
    } finally {
      setLoading(false);
    }
  }
  async function generate() {
    if (!result) return;
    setGenerating(true);
    setError("");
    try {
      setRoute(await generateCyclingRoute(result.id));
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : "No se ha podido generar el recorrido.",
      );
    } finally {
      setGenerating(false);
    }
  }
  async function loadWeather() {
    if (!result) return;
    setLoadingWeather(true);
    setError("");
    setWindAnalysis(null);
    try {
      setWeather(await getRouteWeather(result.id));
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : "No se ha podido consultar la meteorología.",
      );
    } finally {
      setLoadingWeather(false);
    }
  }
  async function analyzeWind() { if (!result) return; setAnalyzingWind(true); setError(""); setWeather(null); try { setWindAnalysis(await analyzeRouteWind(result.id)); } catch (e) { setError(e instanceof ApiError ? e.message : "No se ha podido analizar el viento en la ruta."); } finally { setAnalyzingWind(false); } }
  async function downloadGpx() { if (!result || !route) return; setDownloadingGpx(true); setError(""); try { await downloadRouteGpx(result.id); } catch { setError("No se ha podido generar el archivo GPX."); } finally { setDownloadingGpx(false); } }
  function returnToPlanningForm() {
    setResult(null);
    setRoute(null);
    setWeather(null);
    setWindAnalysis(null);
    setError("");
  }
  if (result)
    return (
      <section className="form-card success-card">
        <h1>Planificación guardada</h1>
        <p>
          {result.startLocation} · {result.date}
        </p>
        {error && <p className="form-error">{error}</p>}
        <StartLocationMap
          latitude={result.latitude}
          longitude={result.longitude}
          startLocation={result.startLocation}
          geometry={route?.geometry}
        />
        {route ? (
          <section>
            <h2>{route.optimization ? "Ruta seleccionada" : "Recorrido generado"}</h2>
            <p>
              Distancia solicitada: {route.requestedDistanceKm} km · Distancia
              generada: {route.actualDistanceKm.toFixed(1)} km
            </p>
            <p>
              Desnivel solicitado: {route.requestedElevationGainM} m
              {route.ascentM !== undefined
                ? ` · Desnivel generado: ${Math.round(route.ascentM)} m`
                : ""}
            </p>
            <p>
              {route.durationSeconds
                ? `Duración estimada: ${Math.round(route.durationSeconds / 60)} min`
                : "Duración estimada no disponible."}
            </p>
            {route.optimization && (
              <section>
                {route.optimization.selectionMode === "wind-optimized" ? (
                  <p>
                    Se han comparado {route.optimization.candidateCount} alternativas y se ha seleccionado la más favorable para el viento durante el regreso. Distancia generada: {route.actualDistanceKm.toFixed(1)} km.
                  </p>
                ) : (
                  <p>
                    No se encontró una alternativa dentro del margen de ±20 % de la distancia solicitada. Se muestra la ruta disponible más cercana: {route.actualDistanceKm.toFixed(1)} km frente a {route.requestedDistanceKm} km solicitados. El viento se ha analizado, pero esta ruta no se considera optimizada por distancia.
                  </p>
                )}
                <p>Puntuación favorable para el regreso: {route.optimization.analysis.favorableWindScore.toFixed(1)} / 100</p>
                <p>Regreso — Cola: {route.optimization.analysis.returnTailwindPercent.toFixed(1)}% · Lateral: {route.optimization.analysis.returnCrosswindPercent.toFixed(1)}% · Frontal: {route.optimization.analysis.returnHeadwindPercent.toFixed(1)}%</p>
                {route.optimization.wind.riskLevel === "high" && <p className="form-error">Las condiciones previstas de viento requieren precaución.</p>}
                {route.optimization.wind.riskLevel === "dangerous" && <p className="form-error">Las condiciones previstas de viento pueden ser peligrosas. La favorabilidad del recorrido no implica que sea seguro realizarlo.</p>}
                <h2>Rutas analizadas</h2>
                {route.optimization.candidates.map((candidate) => (
                  <article key={candidate.seed}>
                    <h3>Ruta {candidate.seed}{candidate.selected ? " · Seleccionada" : ""}</h3>
                    <p>{candidate.actualDistanceKm.toFixed(1)} km{candidate.ascentM === undefined ? "" : ` · ${Math.round(candidate.ascentM)} m de desnivel`}</p>
                    <p>{candidate.withinDistanceTolerance ? "Dentro del margen de distancia solicitado." : "Fuera del margen de distancia solicitado."}</p>
                    <p>Score: {candidate.favorableWindScore.toFixed(1)}</p>
                    <p>Regreso: {candidate.returnTailwindPercent.toFixed(1)}% cola / {candidate.returnCrosswindPercent.toFixed(1)}% lateral / {candidate.returnHeadwindPercent.toFixed(1)}% frontal</p>
                  </article>
                ))}
              </section>
            )}
          </section>
        ) : (
          <button
            className="button button-primary"
            onClick={generate}
            disabled={generating}
          >
            {generating ? (result.favorableWind ? "Comparando rutas según el viento..." : "Generando recorrido...") : (result.favorableWind ? "Buscar ruta favorable al viento" : "Generar recorrido")}
          </button>
        )}
        {route && <button className="button button-primary" onClick={downloadGpx} disabled={downloadingGpx}>{downloadingGpx ? "Preparando GPX..." : "Descargar GPX"}</button>}
        <button
          className="button button-primary"
          onClick={loadWeather}
          disabled={loadingWeather}
        >
          {loadingWeather
            ? "Consultando meteorología..."
            : "Consultar meteorología"}
        </button>
        {result.favorableWind && <button className="button button-primary" onClick={analyzeWind} disabled={analyzingWind}>{analyzingWind ? "Analizando viento en la ruta..." : "Analizar viento en la ruta"}</button>}
        {windAnalysis && <section><h2>Análisis del viento en la ruta</h2><p>Velocidad: {windAnalysis.wind.speedKmh} km/h · Rachas: {windAnalysis.wind.gustKmh} km/h</p><p>Dirección: {windAnalysis.wind.directionDegrees}° — {windAnalysis.wind.directionCardinal} · Nivel: {windAnalysis.wind.riskLevel}</p><p>Ruta completa — Cola: {windAnalysis.analysis.tailwindPercent.toFixed(1)}% · Frontal: {windAnalysis.analysis.headwindPercent.toFixed(1)}% · Lateral: {windAnalysis.analysis.crosswindPercent.toFixed(1)}%</p><p>Regreso — Cola: {windAnalysis.analysis.returnTailwindPercent.toFixed(1)}% · Frontal: {windAnalysis.analysis.returnHeadwindPercent.toFixed(1)}% · Lateral: {windAnalysis.analysis.returnCrosswindPercent.toFixed(1)}%</p><p>Puntuación favorable: {windAnalysis.analysis.favorableWindScore.toFixed(1)} / 100</p>{(windAnalysis.wind.riskLevel === "high" || windAnalysis.wind.riskLevel === "dangerous") && <p className="form-error">Una ruta puede presentar viento favorable y, al mismo tiempo, resultar peligrosa debido a la intensidad o las rachas.</p>}</section>}
        {weather && (
          <section>
            <h2>Pronóstico meteorológico</h2>
            <p>
              <span role="img" aria-label={weatherCondition(weather.weatherCode).label}>{weatherCondition(weather.weatherCode).icon}</span>{" "}
              {weatherCondition(weather.weatherCode).label}
            </p>
            <p>
              Temperatura: {weather.temperatureC.toFixed(1)} °C · Sensación: {weather.apparentTemperatureC.toFixed(1)} °C · Precipitación: {weather.precipitationProbabilityPercent}%
            </p>
            <p>
              Velocidad: {weather.windSpeedKmh} km/h · Rachas:{" "}
              {weather.windGustKmh} km/h
            </p>
            <p>
              Dirección: {weather.windDirectionDegrees}° —{" "}
              {weather.windDirectionCardinal}
            </p>
            <p>Nivel: {weather.riskLevel}</p>
            {(weather.riskLevel === "high" ||
              weather.riskLevel === "dangerous") && (
              <p className="form-error">
                Las condiciones de viento pueden resultar peligrosas para la
                práctica del ciclismo.
              </p>
            )}
            <p>Weather data by Open-Meteo</p>
          </section>
        )}
        <button className="button button-secondary" onClick={returnToPlanningForm}>
          Volver a planificar ruta
        </button>
      </section>
    );
  return (
    <section className="form-card">
      <p className="eyebrow">PLANIFICA TU RUTA</p>
      <h1>Tu próxima salida</h1>
      <form onSubmit={submit}>
        <label>
          Punto de partida
          <input
            value={form.startLocation}
            onChange={(e) =>
              setForm({ ...form, startLocation: e.target.value })
            }
          />
        </label>
        <label>
          Fecha
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </label>
        <label>
          Distancia (km)
          <input
            type="number"
            min="10"
            max="300"
            value={form.distanceKm}
            onChange={(e) =>
              setForm({ ...form, distanceKm: Number(e.target.value) })
            }
          />
        </label>
        <label>
          Desnivel acumulado (m)
          <input
            type="number"
            min="0"
            max="5000"
            value={form.elevationGainM}
            onChange={(e) =>
              setForm({ ...form, elevationGainM: Number(e.target.value) })
            }
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={form.favorableWind}
            onChange={(e) =>
              setForm({ ...form, favorableWind: e.target.checked })
            }
          />{" "}
          Ruta favorable al viento
        </label>
        <p>Al seleccionar esta preferencia, CicloViento compara hasta tres recorridos circulares según el viento previsto para el regreso.</p>
        {error && <p className="form-error">{error}</p>}
        <button className="button button-primary" disabled={loading}>
          {loading ? "Guardando…" : "Planificar ruta"}
        </button>
      </form>
    </section>
  );
}
