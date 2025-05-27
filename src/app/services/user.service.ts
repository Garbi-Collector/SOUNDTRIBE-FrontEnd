import { Injectable } from '@angular/core';
import {AuthService} from "./auth.service";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {BackEndRoutesService} from "../back-end.routes.service";
import {catchError, Observable, throwError} from 'rxjs';
import {GetAll, UserDescription, UserGet} from "../dtos/usuarios/users.dto";
import {map} from "rxjs/operators";
import { FechasService } from './fechas.service';


@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl: string;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private backEndRoutes: BackEndRoutesService,
    public fechasService: FechasService
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

  isFollowing(idToCheck: number): Observable<boolean> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<boolean>(`${this.apiUrl}/is-following/${idToCheck}`, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * Envía una petición DELETE al backend para dejar de seguir a un usuario específico (por su ID).
   * Requiere autenticación (token JWT en headers).
   * El backend devuelve un mensaje de texto ("Has dejado de seguir al usuario").
   */
  unfollowUser(idToUnfollow: number): Observable<string> {
    const headers = this.getAuthHeaders();
    return this.http
      .delete(`${this.apiUrl}/unfollow/${idToUnfollow}`, { headers, responseType: 'text' })
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
      .pipe(
        map(user => this.mapUserDescription(user)),
        catchError(this.handleError)
      );
  }

  /**
   * Envía una solicitud para recuperar la contraseña usando el email.
   * Este endpoint es público y no requiere autenticación.
   */
  recuperarPassword(email: string): Observable<string> {
    return this.http
      .post(`${this.apiUrl}/recuperar-password`, email, {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        responseType: 'text' // Porque el backend devuelve un string plano
      })
      .pipe(catchError(this.handleError));
  }


  /**
   * Obtiene la descripción del usuario autenticado.
   * Usa token JWT y se conecta a /mi-perfil.
   * Devuelve datos del perfil personal del usuario.
   */
  getMyDescription(): Observable<UserDescription> {
    const headers = this.getAuthHeaders();

    // Agregar log para depuración
    console.log('Headers for getMyDescription:', headers);
    console.log('URL for getMyDescription:', `${this.apiUrl}/mi-perfil`);

    return this.http
      .get<UserDescription>(`${this.apiUrl}/mi-perfil`, { headers })
      .pipe(
        map(user => {
          console.log('Raw user data received:', user); // Ver los datos tal como llegan
          // Resto del código...
          return this.mapUserDescription(user);
        }),
        catchError(error => {
          console.error('Error in getMyDescription:', error);
          return throwError(() => error);
        })
      );
  }



  getUserDescriptionBySlug(slug: string): Observable<UserDescription> {
    return this.http
      .get<UserDescription>(`${this.apiUrl}/perfil/slug/${slug}`)
      .pipe(
        map(user => {
          if (user.urlimage && !user.urlimage.startsWith('http')) {
            user.urlimage = `${this.backEndRoutes.userServiceUrl}/fotos/image/${user.urlimage}`;
          }

          if (user.artistasSeguidos) {
            user.artistasSeguidos = user.artistasSeguidos.map(artist => {
              if (artist.urlFoto && !artist.urlFoto.startsWith('http')) {
                artist.urlFoto = `${this.backEndRoutes.userServiceUrl}/fotos/image/${artist.urlFoto}`;
              }
              return artist;
            });
          }

          return this.mapUserDescription(user);
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


  /**
   * Normaliza y formatea el campo createdAt del UserDescription.
   */
  private mapUserDescription(user: UserDescription): UserDescription {
    if (Array.isArray(user.createdAt)) {
      const date = new Date(
        user.createdAt[0],
        user.createdAt[1] - 1,
        user.createdAt[2],
        user.createdAt[3],
        user.createdAt[4],
        user.createdAt[5],
        user.createdAt[6]
      );
      user.createdAt = this.fechasService.formatearFechaDiaDeMesYAnio(date.toISOString());
    } else if (typeof user.createdAt === 'string') {
      user.createdAt = this.fechasService.formatearFechaDiaDeMesYAnio(user.createdAt);
    }

    return user;
  }



  getMutualArtistFriends(): Observable<UserGet[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<UserGet[]>(`${this.apiUrl}/mutual-artist-friends`, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * Cambia la descripción del usuario autenticado.
   * Requiere autenticación (token JWT en headers).
   * El backend espera un parámetro "newDescription" en la URL.
   */
  changeDescription(newDescription: string): Observable<string> {
    const headers = this.getAuthHeaders();
    const params = { newDescription };

    return this.http
      .put(`${this.apiUrl}/change-description`, null, {
        headers,
        params,
        responseType: 'text'
      })
      .pipe(catchError(this.handleError));
  }
}
