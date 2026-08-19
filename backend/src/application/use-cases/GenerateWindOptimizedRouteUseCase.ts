import type { RoutePlan } from '../../domain/entities/RoutePlan.js';
import type { RoutePlanRepository } from '../../domain/repositories/RoutePlanRepository.js';
import type { GeneratedRoute, RoutingService } from '../services/RoutingService.js';
import type { WeatherService, WindForecast } from '../services/WeatherService.js';
import { WindRouteAnalyzer, type WindRouteAnalysis } from '../services/WindRouteAnalyzer.js';
import { classifyWindRisk, windDirectionCardinal, type WindRiskLevel } from '../services/WindRisk.js';

export const WIND_ROUTE_SEEDS = [1, 2, 3] as const;
export const WIND_ROUTE_DISTANCE_TOLERANCE = 0.2;
export type RouteSelectionMode = 'wind-optimized' | 'distance-fallback';

export interface RouteCandidateSummary {
  seed: number;
  actualDistanceKm: number;
  ascentM?: number;
  favorableWindScore: number;
  returnTailwindPercent: number;
  returnHeadwindPercent: number;
  returnCrosswindPercent: number;
  withinDistanceTolerance: boolean;
  selected: boolean;
}

export interface WindOptimizedRouteResult {
  routePlanId: string;
  route: GeneratedRoute;
  weather: WindForecast;
  riskLevel: WindRiskLevel;
  directionCardinal: string;
  analysis: WindRouteAnalysis;
  selectedCandidate: number;
  candidateCount: number;
  selectionMode: RouteSelectionMode;
  candidates: RouteCandidateSummary[];
}

export class WindOptimizedRouteNotFoundError extends Error {
  constructor() {
    super('Route plan was not found.');
    this.name = 'WindOptimizedRouteNotFoundError';
  }
}

export class NoGeneratedWindRouteError extends Error {
  constructor() {
    super('No real wind route candidate was generated.');
    this.name = 'NoGeneratedWindRouteError';
  }
}

interface AnalyzedCandidate {
  seed: number;
  route: GeneratedRoute;
  analysis: WindRouteAnalysis;
  distanceDifferenceKm: number;
  withinDistanceTolerance: boolean;
}

export class GenerateWindOptimizedRouteUseCase {
  constructor(
    private readonly routePlanRepository: RoutePlanRepository,
    private readonly routingService: RoutingService,
    private readonly weatherService: WeatherService,
    private readonly analyzer = new WindRouteAnalyzer(),
  ) {}

  async execute(routePlanId: string, authenticatedUserId: string): Promise<WindOptimizedRouteResult> {
    const routePlan = await this.routePlanRepository.findById(routePlanId);
    if (!routePlan || routePlan.userId !== authenticatedUserId) throw new WindOptimizedRouteNotFoundError();
    return this.executeForRoutePlan(routePlan);
  }

  async executeForRoutePlan(routePlan: RoutePlan): Promise<WindOptimizedRouteResult> {
    const forecast = await this.weatherService.getWindForecast({
      latitude: routePlan.latitude,
      longitude: routePlan.longitude,
      date: routePlan.date,
      referenceHour: 9,
    });

    const candidates: AnalyzedCandidate[] = [];

    for (const seed of WIND_ROUTE_SEEDS) {
      try {
        const route = await this.routingService.generateRoundTrip({
          start: { latitude: routePlan.latitude, longitude: routePlan.longitude },
          targetDistanceKm: routePlan.distanceKm,
          seed,
        });
        const actualDistanceKm = route.distanceM / 1000;
        candidates.push({
          seed,
          route,
          analysis: this.analyzer.analyze(route, forecast),
          distanceDifferenceKm: Math.abs(actualDistanceKm - routePlan.distanceKm),
          withinDistanceTolerance: isDistanceWithinTolerance(actualDistanceKm, routePlan.distanceKm),
        });
      } catch {
        // A failed provider candidate does not prevent trying the next deterministic seed.
      }
    }

    if (candidates.length === 0) throw new NoGeneratedWindRouteError();

    const optimizedCandidates = candidates.filter((candidate) => candidate.withinDistanceTolerance);
    const selectionMode: RouteSelectionMode = optimizedCandidates.length > 0
      ? 'wind-optimized'
      : 'distance-fallback';
    const selected = [...(optimizedCandidates.length > 0 ? optimizedCandidates : candidates)]
      .sort(selectionMode === 'wind-optimized' ? compareWindOptimizedCandidates : compareDistanceFallbackCandidates)[0];
    const summaries = candidates
      .sort((left, right) => left.seed - right.seed)
      .map((candidate) => toSummary(candidate, candidate.seed === selected.seed));

    return {
      routePlanId: routePlan.id,
      route: selected.route,
      weather: forecast,
      riskLevel: classifyWindRisk(forecast),
      directionCardinal: windDirectionCardinal(forecast.windDirectionDegrees),
      analysis: selected.analysis,
      selectedCandidate: selected.seed,
      candidateCount: candidates.length,
      selectionMode,
      candidates: summaries,
    };
  }
}

function isDistanceWithinTolerance(actualDistanceKm: number, targetDistanceKm: number): boolean {
  return Math.abs(actualDistanceKm - targetDistanceKm) <= targetDistanceKm * WIND_ROUTE_DISTANCE_TOLERANCE;
}

function compareWindOptimizedCandidates(left: AnalyzedCandidate, right: AnalyzedCandidate): number {
  return right.analysis.favorableWindScore - left.analysis.favorableWindScore
    || left.distanceDifferenceKm - right.distanceDifferenceKm
    || left.seed - right.seed;
}

function compareDistanceFallbackCandidates(left: AnalyzedCandidate, right: AnalyzedCandidate): number {
  return left.distanceDifferenceKm - right.distanceDifferenceKm
    || right.analysis.favorableWindScore - left.analysis.favorableWindScore
    || left.seed - right.seed;
}

function toSummary(candidate: AnalyzedCandidate, selected: boolean): RouteCandidateSummary {
  return {
    seed: candidate.seed,
    actualDistanceKm: candidate.route.distanceM / 1000,
    ...(candidate.route.ascentM === undefined ? {} : { ascentM: candidate.route.ascentM }),
    favorableWindScore: candidate.analysis.favorableWindScore,
    returnTailwindPercent: candidate.analysis.returnTailwindPercent,
    returnHeadwindPercent: candidate.analysis.returnHeadwindPercent,
    returnCrosswindPercent: candidate.analysis.returnCrosswindPercent,
    withinDistanceTolerance: candidate.withinDistanceTolerance,
    selected,
  };
}
