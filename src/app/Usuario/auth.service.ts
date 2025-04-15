import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

// DTOs (mantener las interfaces existentes)
export interface RegisterRequestDto {
  email: string;
  username: string;
  password: string;
  rol: string;  // "OYENTE" o "ARTISTA"
}

export interface LoginRequestDto {
  emailOrUsername: string;
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
  private apiUrl = 'http://localhost:8080'; // Ajusta esto a la URL de tu backend

  constructor(private http: HttpClient) { }

  // Método para registrar un nuevo usuario
  signup(userData: RegisterRequestDto, file?: File): Observable<string> {
    const formData = new FormData();
    const userBlob = new Blob([JSON.stringify(userData)], { type: 'application/json' });

    formData.append('user', userBlob);

    if (file) {
      formData.append('file', file);
    }

    return this.http.post(`${this.apiUrl}/auth/signup`, formData, { responseType: 'text' })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Método para iniciar sesión
  login(loginData: LoginRequestDto): Observable<JwtLoginResponseDto> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<JwtLoginResponseDto>(`${this.apiUrl}/auth/login`, loginData, { headers })
      .pipe(
        tap(response => {
          console.log('Respuesta de login recibida:', response);
          // Almacenar el token y datos de usuario en localStorage
          localStorage.setItem('auth_token', response.token);
          localStorage.setItem('username', response.username);
          localStorage.setItem('email', response.email);
          if (response.rol) {
            localStorage.setItem('rol', response.rol);
          }
        }),
        catchError(this.handleError)
      );
  }

  // Manejador genérico de errores
  private handleError(error: any): Observable<never> {
    console.error('Error en la solicitud HTTP:', error);
    return throwError(() => error);
  }

  // Verificar si un email ya existe
  checkEmailExists(email: string): Observable<boolean> {
    const params = new HttpParams().set('email', email);
    return this.http.get<boolean>(`${this.apiUrl}/auth/email-exists`, { params })
      .pipe(catchError(this.handleError));
  }

  // Resto de los métodos se mantienen igual...
  // Verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    return localStorage.getItem('auth_token') !== null;
  }

  // Cerrar sesión
  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('rol');
  }

  // Obtener token
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  // Obtener nombre de usuario actual
  getCurrentUsername(): string | null {
    return localStorage.getItem('username');
  }

  // Obtener rol del usuario actual
  getCurrentUserRole(): string | null {
    return localStorage.getItem('rol');
  }

  // Verificar si el usuario es un artista
  isArtista(): boolean {
    const rol = this.getCurrentUserRole();
    return rol === 'ARTISTA';
  }

  // Verificar si el usuario es un oyente
  isOyente(): boolean {
    const rol = this.getCurrentUserRole();
    return rol === 'OYENTE';
  }
}
