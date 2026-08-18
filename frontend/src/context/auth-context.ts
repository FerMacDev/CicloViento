import { createContext } from 'react';

import type { ChangePasswordRequest, LoginRequest, User } from '../types/auth';

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isRestoring: boolean;
  login(input: LoginRequest): Promise<User>;
  changePassword(input: ChangePasswordRequest): Promise<void>;
  logout(): void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
