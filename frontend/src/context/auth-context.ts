import { createContext } from 'react';

import type { ChangePasswordRequest, LoginRequest, User } from '../types/auth';
import type { GeneratedRouteResponse, RoutePlanRequest, RoutePlanResponse } from '../types/route-plan';

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isRestoring: boolean;
  login(input: LoginRequest): Promise<User>;
  changePassword(input: ChangePasswordRequest): Promise<void>;
  logout(): void;
  createRoutePlan(input: RoutePlanRequest): Promise<RoutePlanResponse>;
  generateCyclingRoute(routePlanId: string): Promise<GeneratedRouteResponse>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
