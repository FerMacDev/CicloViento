import { type ReactNode, useEffect, useMemo, useState } from 'react';

import { apiClient } from '../services/api-client';
import { authStorage } from '../services/auth-storage';
import type { User } from '../types/auth';
import type { RoutePlanRequest, RoutePlanResponse } from '../types/route-plan';
import { AuthContext, type AuthContextValue } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    const storedSession = authStorage.load();
    if (!storedSession) {
      setIsRestoring(false);
      return;
    }

    void apiClient.getAuthenticatedUser(storedSession.accessToken)
      .then((authenticatedUser) => {
        setAccessToken(storedSession.accessToken);
        setUser(authenticatedUser);
        authStorage.save({ accessToken: storedSession.accessToken, user: authenticatedUser });
      })
      .catch(() => authStorage.clear())
      .finally(() => setIsRestoring(false));
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: Boolean(accessToken && user),
    isRestoring,
    async login(input) {
      const response = await apiClient.login(input);
      setAccessToken(response.accessToken);
      setUser(response.user);
      authStorage.save(response);
      return response.user;
    },
    async changePassword(input) {
      if (!accessToken || !user) throw new Error('No active session.');

      await apiClient.changePassword(input, accessToken);
      const updatedUser = { ...user, mustChangePassword: false };
      setUser(updatedUser);
      authStorage.save({ accessToken, user: updatedUser });
    },
    logout() {
      setAccessToken(null);
      setUser(null);
      authStorage.clear();
    },
    async createRoutePlan(input: RoutePlanRequest): Promise<RoutePlanResponse> { if (!accessToken) throw new Error('No active session.'); return apiClient.createRoutePlan(input, accessToken); },
    async generateCyclingRoute(routePlanId: string) { if (!accessToken) throw new Error('No active session.'); return apiClient.generateCyclingRoute(routePlanId, accessToken); },
    async getRouteWeather(routePlanId: string) { if (!accessToken) throw new Error('No active session.'); return apiClient.getRouteWeather(routePlanId, accessToken); },
    async analyzeRouteWind(routePlanId:string) { if (!accessToken) throw new Error('No active session.'); return apiClient.analyzeRouteWind(routePlanId,accessToken); },
    async downloadRouteGpx(routePlanId: string) { if (!accessToken) throw new Error('No active session.'); await apiClient.downloadRouteGpx(routePlanId, accessToken); },
  }), [accessToken, isRestoring, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
