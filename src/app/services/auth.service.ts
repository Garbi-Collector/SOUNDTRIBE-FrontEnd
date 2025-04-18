import { Injectable } from '@angular/core';
import {BehaviorSubject, catchError, Observable, tap, throwError} from "rxjs";
import {HttpClient, HttpHeaders, HttpParams} from "@angular/common/http";
import {BackEndRoutesService} from "../back-end.routes.service";
import {JwtLoginResponseDto, LoginRequestDto, RegisterRequestDto} from "../dtos/auth.dto";

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.checkAuthentication());
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  private apiUrl: string;

  constructor(
    private http: HttpClient,
    private backEndRoutes: BackEndRoutesService
  ) {
    this.apiUrl = this.backEndRoutes.userServiceUrl;
  }

  /**
   * Registra un nuevo usuario. Si se proporciona un archivo (como una imagen de perfil),
   * también se incluye en la solicitud.
   */
  signUp(userData: RegisterRequestDto, file?: File): Observable<string>{
    const formData = new FormData();
    const userBlob = new Blob([JSON.stringify(userData)], {type: 'application/json'});
    formData.append('user',userBlob);
    if (file) formData.append('file', file);

    return this.http.post(`${this.apiUrl}/auth/signup`, formData, { responseType: 'text' })
      .pipe(catchError(this.handleError));
  }

  /**
   * inicia sesion a un usuario
   * @param loginData
   */
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

  /**
   * Verifica si el correo electrónico ya está registrado
   */
  checkEmailExists(email: string): Observable<boolean> {
    const params = new HttpParams().set('email', email);
    return this.http.get<boolean>(`${this.apiUrl}/auth/email-exists`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Verifica si el nombre de usuario ya está registrado
   */
  checkUsernameExists(username: string): Observable<boolean> {
    const params = new HttpParams().set('username', username);
    return this.http.get<boolean>(`${this.apiUrl}/auth/username-exists`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Verifica si el usuario está autenticado (tiene un token de autenticación en localStorage)
   */
  isAuthenticated(): boolean {
    return localStorage.getItem('auth_token') !== null;
  }

  /**
   * Cierra la sesión del usuario eliminando los datos almacenados en localStorage
   * y emitiendo el estado de no autenticación.
   */
  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('rol');

    // Emitir el estado de no autenticación
    this.isAuthenticatedSubject.next(false);
  }

  /**
   * Obtiene el token de autenticación del usuario desde localStorage
   */
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Obtiene el nombre de usuario actual desde localStorage
   */
  getCurrentUsername(): string | null {
    return localStorage.getItem('username');
  }

  /**
   * Obtiene el rol del usuario actual desde localStorage
   */
  getCurrentUserRole(): string | null {
    return localStorage.getItem('rol');
  }

  /**
   * Verifica si el usuario tiene el rol de "ARTISTA"
   */
  isArtista(): boolean {
    return this.getCurrentUserRole() === 'ARTISTA';
  }

  /**
   * Verifica si el usuario tiene el rol de "OYENTE"
   */
  isOyente(): boolean {
    return this.getCurrentUserRole() === 'OYENTE';
  }
  /**
   * Verifica si el usuario tiene el rol de "ADMIN"
   */
  isAdmin(): boolean {
    return this.getCurrentUserRole() === 'ADMIN';
  }

  /**
   * Méto-do privado que verifica si el usuario está autenticado en base al token almacenado en localStorage
   */
  private checkAuthentication(): boolean {
    return localStorage.getItem('auth_token') !== null;
  }


  /**
   * Méto-do privado para manejar errores en las solicitudes HTTP
   */
  private handleError(error: any): Observable<never> {
    console.error('Error en AuthService:', error);
    return throwError(() => error);
  }
}
