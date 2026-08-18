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
export function PlanRoutePage() {
  const { createRoutePlan, generateCyclingRoute, getRouteWeather, analyzeRouteWind } = useAuth();
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
  async function analyzeWind() { if (!result) return; setAnalyzingWind(true); setError(""); try { setWindAnalysis(await analyzeRouteWind(result.id)); } catch (e) { setError(e instanceof ApiError ? e.message : "No se ha podido analizar el viento en la ruta."); } finally { setAnalyzingWind(false); } }
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
            <h2>Recorrido generado</h2>
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
            <p>
              Ruta favorable:{" "}
              {route.favorableWindRequested ? "solicitada" : "no solicitada"}.
              El análisis de viento sobre el recorrido se realizará en la
              siguiente fase.
            </p>
          </section>
        ) : (
          <button
            className="button button-primary"
            onClick={generate}
            disabled={generating}
          >
            {generating ? "Generando recorrido..." : "Generar recorrido"}
          </button>
        )}
        <button
          className="button button-primary"
          onClick={loadWeather}
          disabled={loadingWeather}
        >
          {loadingWeather
            ? "Consultando meteorología..."
            : "Consultar meteorología"}
        </button>
        <button className="button button-primary" onClick={analyzeWind} disabled={analyzingWind}>{analyzingWind ? "Analizando viento en la ruta..." : "Analizar viento en la ruta"}</button>
        {windAnalysis && <section><h2>Análisis del viento en la ruta</h2><p>Velocidad: {windAnalysis.wind.speedKmh} km/h · Rachas: {windAnalysis.wind.gustKmh} km/h</p><p>Dirección: {windAnalysis.wind.directionDegrees}° — {windAnalysis.wind.directionCardinal} · Nivel: {windAnalysis.wind.riskLevel}</p><p>Ruta completa — Cola: {windAnalysis.analysis.tailwindPercent.toFixed(1)}% · Frontal: {windAnalysis.analysis.headwindPercent.toFixed(1)}% · Lateral: {windAnalysis.analysis.crosswindPercent.toFixed(1)}%</p><p>Regreso — Cola: {windAnalysis.analysis.returnTailwindPercent.toFixed(1)}% · Frontal: {windAnalysis.analysis.returnHeadwindPercent.toFixed(1)}% · Lateral: {windAnalysis.analysis.returnCrosswindPercent.toFixed(1)}%</p><p>Puntuación favorable: {windAnalysis.analysis.favorableWindScore.toFixed(1)} / 100</p>{(windAnalysis.wind.riskLevel === "high" || windAnalysis.wind.riskLevel === "dangerous") && <p className="form-error">Una ruta puede presentar viento favorable y, al mismo tiempo, resultar peligrosa debido a la intensidad o las rachas.</p>}{result.favorableWind && <p>Has solicitado una ruta favorable al viento. Actualmente CicloViento analiza el recorrido generado; la selección automática de la mejor alternativa se incorporará en la siguiente fase.</p>}</section>}
        {weather && (
          <section>
            <h2>Condiciones de viento</h2>
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
        <p>La optimización por viento se incorporará en una fase posterior.</p>
        {error && <p className="form-error">{error}</p>}
        <button className="button button-primary" disabled={loading}>
          {loading ? "Guardando…" : "Planificar ruta"}
        </button>
      </form>
    </section>
  );
}
