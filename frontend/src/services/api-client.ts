import type {
  ChangePasswordRequest,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  User,
} from '../types/auth';
import type { GeneratedRouteResponse, RoutePlanRequest, RoutePlanResponse, RouteWeatherResponse, WindAnalysisResponse } from '../types/route-plan';

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}, accessToken?: string): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });
  const data: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = typeof data === 'object' && data !== null && 'message' in data && typeof data.message === 'string'
      ? data.message
      : 'No se ha podido completar la solicitud.';
    throw new ApiError(response.status, message);
  }

  return data as T;
}

export const apiClient = {
  register(input: RegisterRequest): Promise<RegisterResponse> {
    return request('/users/register', { method: 'POST', body: JSON.stringify(input) });
  },

  login(input: LoginRequest): Promise<LoginResponse> {
    return request('/auth/login', { method: 'POST', body: JSON.stringify(input) });
  },

  getAuthenticatedUser(accessToken: string): Promise<User> {
    return request('/auth/me', {}, accessToken);
  },

  changePassword(input: ChangePasswordRequest, accessToken: string): Promise<void> {
    return request('/auth/change-password', { method: 'POST', body: JSON.stringify(input) }, accessToken);
  },
  createRoutePlan(input: RoutePlanRequest, accessToken: string): Promise<RoutePlanResponse> { return request('/route-plans', { method: 'POST', body: JSON.stringify(input) }, accessToken); },
  generateCyclingRoute(routePlanId: string, accessToken: string): Promise<GeneratedRouteResponse> {
    return request(`/route-plans/${encodeURIComponent(routePlanId)}/generate`, { method: 'POST' }, accessToken);
  },
  getRouteWeather(routePlanId: string, accessToken: string): Promise<RouteWeatherResponse> { return request(`/route-plans/${encodeURIComponent(routePlanId)}/weather`, {}, accessToken); },
  analyzeRouteWind(routePlanId:string,accessToken:string):Promise<WindAnalysisResponse>{return request(`/route-plans/${encodeURIComponent(routePlanId)}/wind-analysis`,{method:'POST'},accessToken);},
};
