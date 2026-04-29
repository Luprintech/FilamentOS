import { HttpClientError, httpRequest } from '@/shared/api/http-client';

export interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  photo: string | null;
}

export interface GuestSession {
  id: string;
  expiresAt?: number;
}

interface AuthUserResponse {
  user: AuthUser | null;
  guest?: GuestSession | null;
}

export async function getAuthState(): Promise<{ user: AuthUser | null; guest: GuestSession | null }> {
  try {
    const data = await httpRequest<AuthUserResponse>({ url: '/api/auth/user' });
    return { user: data?.user ?? null, guest: data?.guest ?? null };
  } catch (error) {
    if (error instanceof HttpClientError && (error.status === 401 || error.status === 403)) {
      return { user: null, guest: null };
    }
    throw error;
  }
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const state = await getAuthState();
  return state.user;
}

export async function startGuestSession(): Promise<GuestSession> {
  const data = await httpRequest<{ guest: GuestSession }>({
    url: '/api/auth/guest/start',
    init: { method: 'POST' },
  });
  return data.guest;
}

export async function logoutGuestSession(): Promise<void> {
  await httpRequest<unknown>({ url: '/api/auth/guest/logout', init: { method: 'POST' } });
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface RegisterResult {
  /** true cuando el registro requiere verificación por email */
  pending: boolean;
  email?: string;
  user?: AuthUser;
}

export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
  const data = await httpRequest<RegisterResult>({
    url: '/api/auth/register',
    init: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
  });
  return data;
}

export async function loginWithEmail(email: string, password: string): Promise<AuthUser> {
  const data = await httpRequest<{ user: AuthUser }>({
    url: '/api/auth/login',
    init: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    },
  });
  return data.user;
}

export async function logoutAuth(): Promise<void> {
  await httpRequest<unknown>({
    url: '/api/auth/logout',
    init: { method: 'GET' },
  });
}

export async function forgotPassword(email: string): Promise<void> {
  await httpRequest<unknown>({
    url: '/api/auth/forgot-password',
    init: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    },
  });
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await httpRequest<unknown>({
    url: '/api/auth/reset-password',
    init: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    },
  });
}

export async function resendVerification(email: string): Promise<void> {
  await httpRequest<unknown>({
    url: '/api/auth/resend-verification',
    init: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    },
  });
}
