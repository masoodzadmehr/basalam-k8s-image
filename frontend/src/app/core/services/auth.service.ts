import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import type { AuthResponse, LoginRequest, RefreshTokenRequest, RegisterRequest, User } from '../models';

interface JwtPayload {
  sub?: string;
  role?: string;
  exp?: number;
  [key: string]: unknown;
}

const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUserSignal = signal<User | null>(null);
  private readonly isAuthenticatedSignal = signal<boolean>(false);
  private readonly userRoleSignal = signal<string>('');

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = this.isAuthenticatedSignal.asReadonly();
  readonly userRole = this.userRoleSignal.asReadonly();

  private readonly apiUrl = 'https://admin.titanapp.dev/api';

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) { }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, request)
      .pipe(tap(response => this.handleAuthResponse(response)));
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, request)
      .pipe(tap(response => this.handleAuthResponse(response)));
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const body: RefreshTokenRequest = { refresh_token: refreshToken ?? '' };
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/refresh`, body)
      .pipe(tap(response => this.handleAuthResponse(response)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    this.currentUserSignal.set(null);
    this.isAuthenticatedSignal.set(false);
    this.userRoleSignal.set('');
    this.router.navigate(['/login']);
  }

  init(): void {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      return;
    }

    const payload = this.parseJwt(token);
    if (!payload || this.isTokenExpired(payload)) {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (refreshToken) {
        this.refreshToken().subscribe({
          error: () => this.logout(),
        });
      } else {
        this.logout();
      }
      return;
    }

    const role: string = payload.role ?? '';
    const username: string = payload.sub ?? '';

    this.userRoleSignal.set(role);
    this.isAuthenticatedSignal.set(true);
    this.currentUserSignal.set({
      id: 0,
      uid: '',
      username,
      email: '',
      firstName: '',
      lastName: '',
      role: role as User['role'],
      enabled: true,
    });
  }

  getAccessToken(): string {
    return localStorage.getItem(TOKEN_KEY) ?? '';
  }

  private handleAuthResponse(response: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, response.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);

    this.userRoleSignal.set(response.role);
    this.isAuthenticatedSignal.set(true);
    this.currentUserSignal.set({
      id: 0,
      uid: '',
      username: response.username,
      email: response.email,
      firstName: '',
      lastName: '',
      role: response.role as User['role'],
      enabled: true,
    });
  }

  private parseJwt(token: string): JwtPayload | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      return JSON.parse(jsonPayload) as JwtPayload;
    } catch {
      return null;
    }
  }

  private isTokenExpired(payload: JwtPayload): boolean {
    const exp = payload.exp;
    if (!exp) {
      return true;
    }
    return Date.now() >= exp * 1000;
  }
}
