import {Injectable} from '@angular/core';
import {BehaviorSubject, catchError, Observable, tap, throwError} from "rxjs";
import {HttpClient, HttpHeaders, HttpParams} from "@angular/common/http";
import {BackEndRoutesService} from "../back-end.routes.service";
import {ChangePasswordRequestDto, JwtLoginResponseDto, LoginRequestDto, RegisterRequestDto} from "../dtos/usuarios/auth.dto";
import {jwtDecode} from 'jwt-decode';

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
            // Usar el nuevo méto do para decodificar y almacenar el token
            this.decodeAndStoreToken(response.token);
          }),
          catchError(this.handleError)
        );
    }



  /**
   * Decodifica el token JWT y almacena los datos relevantes en localStorage
   * @param token El token JWT a decodificar
   */
  decodeAndStoreToken(token: string): void {
    try {
      // Decodificar el token
      const decodedToken: any = jwtDecode(token);

      // Almacenar datos relevantes en localStorage
      localStorage.setItem('auth_token', token);

      if (decodedToken.username) {
        localStorage.setItem('username', decodedToken.username);
      }

      if (decodedToken.email) {
        localStorage.setItem('email', decodedToken.email);
      }

      if (decodedToken.role) {
        localStorage.setItem('rol', decodedToken.role);
      }

      // Puedes almacenar otras propiedades del token según sea necesario
      console.log('Token decodificado correctamente:', decodedToken);

      // Actualizar el estado de autenticación
      this.isAuthenticatedSubject.next(true);
    } catch (error) {
      console.error('Error al decodificar el token:', error);
      this.isAuthenticatedSubject.next(false);
    }
  }





  /**
   * Cambia la contraseña del usuario autenticado
   * @param changePasswordData Datos para cambiar la contraseña
   */
  changePassword(changePasswordData: ChangePasswordRequestDto): Observable<string> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`
    });

    return this.http.put(`${this.apiUrl}/auth/change-password`, changePasswordData, {
      headers,
      responseType: 'text'
    }).pipe(catchError(this.handleError));
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
    return this.getCurrentUserRole() === 'ROLE_ARTISTA';
  }

  /**
   * Verifica si el usuario tiene el rol de "OYENTE"
   */
  isOyente(): boolean {
    return this.getCurrentUserRole() === 'ROLE_OYENTE';
  }
  /**
   * Verifica si el usuario tiene el rol de "ADMIN"
   */
  isAdmin(): boolean {
    return this.getCurrentUserRole() === 'ROLE_ADMIN';
  }

  /**
   * Méto-do privado que verifica si el usuario está autenticado en base al token almacenado en localStorage
   */
  private checkAuthentication(): boolean {
    return localStorage.getItem('auth_token') !== null;
  }

  /**
   * Verifica si la contraseña proporcionada coincide con la del usuario actual
   */
  verifyPassword(password: string): Observable<boolean> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`
    });

    const body = { password };

    return this.http.post<boolean>(`${this.apiUrl}/auth/is-my-password`, body, { headers })
      .pipe(catchError(this.handleError));
  }



  /**
   * Méto-do privado para manejar errores en las solicitudes HTTP
   */
  private handleError(error: any): Observable<never> {
    console.error('Error en AuthService:', error);
    return throwError(() => error);
  }
}

