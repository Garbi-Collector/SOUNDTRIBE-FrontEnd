import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import {BehaviorSubject, Observable, throwError} from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { RoutesBackService } from '../../routes-back.service';

// DTOs
export interface RegisterRequestDto {
  email: string;
  username: string;
  password: string;
  rol: string;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface JwtLoginResponseDto {
  token: string;
  username: string;
  email: string;
  rol?: string;
}

export interface PerfilUsuarioDto {
  username: string;
  fotoUrl: string;
  rol?: string;
}

export interface FotoModel {
  id: number;
  filename: string;
  contentType: string;
  size: number;
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.checkAuthentication());
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  private apiUrl: string;

  constructor(private http: HttpClient, private routesBack: RoutesBackService) {
    this.apiUrl = this.routesBack.userServiceUrl;
  }

  signup(userData: RegisterRequestDto, file?: File): Observable<string> {
    const formData = new FormData();
    const userBlob = new Blob([JSON.stringify(userData)], { type: 'application/json' });
    formData.append('user', userBlob);
    if (file) formData.append('file', file);

    return this.http.post(`${this.apiUrl}/auth/signup`, formData, { responseType: 'text' })
      .pipe(catchError(this.handleError));
  }

  login(loginData: LoginRequestDto): Observable<JwtLoginResponseDto> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post<JwtLoginResponseDto>(`${this.apiUrl}/auth/login`, loginData, { headers })
      .pipe(
        tap(response => {
          localStorage.setItem('auth_token', response.token);
          localStorage.setItem('username', response.username);
          localStorage.setItem('email', response.email);
          if (response.rol) localStorage.setItem('rol', response.rol);

          // Emitir el nuevo estado de autenticación
          this.isAuthenticatedSubject.next(true);
        }),
        catchError(this.handleError)
      );
  }

  checkEmailExists(email: string): Observable<boolean> {
    const params = new HttpParams().set('email', email);
    return this.http.get<boolean>(`${this.apiUrl}/auth/email-exists`, { params })
      .pipe(catchError(this.handleError));
  }

  isAuthenticated(): boolean {
    return localStorage.getItem('auth_token') !== null;
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('rol');

    // Emitir el estado de no autenticación
    this.isAuthenticatedSubject.next(false);
  }


  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  getCurrentUsername(): string | null {
    return localStorage.getItem('username');
  }

  getCurrentUserRole(): string | null {
    return localStorage.getItem('rol');
  }

  isArtista(): boolean {
    return this.getCurrentUserRole() === 'ARTISTA';
  }

  isOyente(): boolean {
    return this.getCurrentUserRole() === 'OYENTE';
  }

  private checkAuthentication(): boolean {
    return localStorage.getItem('auth_token') !== null;
  }

  private handleError(error: any): Observable<never> {
    console.error('Error en AuthService:', error);
    return throwError(() => error);
  }
}
