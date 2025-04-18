import { Injectable } from '@angular/core';
import {AuthService} from "./auth.service";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {BackEndRoutesService} from "../back-end.routes.service";
import {catchError, Observable, throwError} from 'rxjs';
import {GetAll, UserDescription, UserGet} from "../dtos/users.dto";
import {map} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl: string;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private backEndRoutes: BackEndRoutesService
  ) {
    this.apiUrl = `${this.backEndRoutes.userServiceUrl}/user`;
  }

  /**
   * Crea y devuelve un objeto HttpHeaders con el token JWT en la cabecera Authorization.
   * Se usa para autenticación en llamadas protegidas al backend.
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  /**
   * Envía una petición POST al backend para seguir a un usuario específico (por su ID).
   * Requiere autenticación (token JWT en headers).
   * El backend devuelve un mensaje de texto ("Seguido correctamente").
   */
  followUser(idToFollow: number): Observable<string> {
    const headers = this.getAuthHeaders();
    return this.http
      .post(`${this.apiUrl}/follow/${idToFollow}`, null, { headers, responseType: 'text' })
      .pipe(catchError(this.handleError));
  }

  /**
   * Trae todos los usuarios disponibles desde el endpoint público (/all).
   * No requiere autenticación.
   * Devuelve un objeto GetAll con una lista de usuarios (usuarios: UserGet[]).
   */
  getAllUsers(): Observable<GetAll> {
    return this.http
      .get<GetAll>(`${this.apiUrl}/all`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Igual que el anterior, pero usa un endpoint protegido (/all/jwt).
   * Solo disponible si el usuario está autenticado.
   * Devuelve TODOS LOS USUARIOS MENOS EL EN SESION.
   */
  getAllUsersWithJwt(): Observable<GetAll> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<GetAll>(`${this.apiUrl}/all/jwt`, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtiene la descripción detallada de un usuario según su ID.
   * El endpoint es público.
   * Devuelve un objeto UserDescription con datos como descripción, rol, foto, artistas que sigue, etc.
   */
  getUserDescription(id: number): Observable<UserDescription> {
    return this.http
      .get<UserDescription>(`${this.apiUrl}/perfil/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtiene la descripción del usuario autenticado.
   * Usa token JWT y se conecta a /mi-perfil.
   * Devuelve datos del perfil personal del usuario.
   */
  getMyDescription(): Observable<UserDescription> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<UserDescription>(`${this.apiUrl}/mi-perfil`, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * Busca el perfil de un usuario usando su slug en lugar de su ID.
   * Además, si las imágenes de perfil o de artistas seguidos vienen sin URL absoluta, las completa con la ruta al backend.
   * Útil para mostrar perfiles en rutas como /perfil/:slug.
   */
  getUserDescriptionBySlug(slug: string): Observable<UserDescription> {
    return this.http
      .get<UserDescription>(`${this.apiUrl}/perfil/slug/${slug}`)
      .pipe(
        map(user => {
          if (user.urlimage && !user.urlimage.startsWith('http')) {
            user.urlimage = `${this.backEndRoutes.userServiceUrl}/fotos/image/${user.urlimage}`;
          }
          // También procesamos las imágenes de los artistas seguidos
          if (user.ArtistasSeguidos) {
            user.ArtistasSeguidos = user.ArtistasSeguidos.map(artist => {
              if (artist.urlFoto && !artist.urlFoto.startsWith('http')) {
                artist.urlFoto = `${this.backEndRoutes.userServiceUrl}/fotos/image/${artist.urlFoto}`;
              }
              return artist;
            });
          }
          return user;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Obtiene una versión reducida del perfil del usuario autenticado (id, username, urlFoto, etc).
   * Usa token y el endpoint /me.
   * También ajusta la URL de la imagen si viene como nombre de archivo.
   * UTIL PARA MOSTRAR EN DATOS MENORES COMO FOTO DE PERFIL EN EL HEADER
   */
  getAuthenticatedUser(): Observable<UserGet> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<UserGet>(`${this.apiUrl}/me`, { headers })
      .pipe(
        map((user) => {
          if (user.urlFoto) {
            user.urlFoto = `${this.backEndRoutes.userServiceUrl}/fotos/image/${user.urlFoto}`;
          }
          return user;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Méto-do interno para manejar errores.
   * Imprime el error en consola y lo lanza como un observable para que lo capture el catchError
   */
  private handleError(error: any): Observable<never> {
    console.error('UserExperienceService error:', error);
    return throwError(() => error);
  }

}
