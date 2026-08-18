export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mustChangePassword: boolean;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
}

export interface RegisterResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface StoredSession {
  accessToken: string;
  user: User;
}
