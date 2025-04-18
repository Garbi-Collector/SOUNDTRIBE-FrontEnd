import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { RoutesBackService } from '../../routes-back.service';

export interface UserGet {
  id: number;
  username: string;
  urlFoto: string;
  slug: string;
  followersCount: number;
}

export interface UserDescription {
  id: number;
  username: string;
  description: string;
  rol: string;
  urlimage: string;
  slug: string;
  createdAt: string;
  ArtistasSeguidos: UserGet[];
  followersCount: number;
}


export interface GetAll {
  usuarios: UserGet[];
}

@Injectable({
  providedIn: 'root',
})
export class UserExperienceService {
  private apiUrl: string;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private routesBack: RoutesBackService
  ) {
    this.apiUrl = `${this.routesBack.userServiceUrl}/api/user`;
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  followUser(idToFollow: number): Observable<string> {
    const headers = this.getAuthHeaders();
    return this.http
      .post(`${this.apiUrl}/follow/${idToFollow}`, null, { headers, responseType: 'text' })
      .pipe(catchError(this.handleError));
  }

  getAllUsers(): Observable<GetAll> {
    return this.http
      .get<GetAll>(`${this.apiUrl}/all`)
      .pipe(catchError(this.handleError));
  }

  getAllUsersWithJwt(): Observable<GetAll> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<GetAll>(`${this.apiUrl}/all/jwt`, { headers })
      .pipe(catchError(this.handleError));
  }

  getUserDescription(id: number): Observable<UserDescription> {
    return this.http
      .get<UserDescription>(`${this.apiUrl}/perfil/${id}`)
      .pipe(catchError(this.handleError));
  }

  getMyDescription(): Observable<UserDescription> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<UserDescription>(`${this.apiUrl}/mi-perfil`, { headers })
      .pipe(catchError(this.handleError));
  }

  getUserDescriptionBySlug(slug: string): Observable<UserDescription> {
    return this.http
      .get<UserDescription>(`${this.apiUrl}/perfil/slug/${slug}`)
      .pipe(
        map(user => {
          if (user.urlimage && !user.urlimage.startsWith('http')) {
            user.urlimage = `${this.routesBack.userServiceUrl}/fotos/image/${user.urlimage}`;
          }
          // También procesamos las imágenes de los artistas seguidos
          if (user.ArtistasSeguidos) {
            user.ArtistasSeguidos = user.ArtistasSeguidos.map(artist => {
              if (artist.urlFoto && !artist.urlFoto.startsWith('http')) {
                artist.urlFoto = `${this.routesBack.userServiceUrl}/fotos/image/${artist.urlFoto}`;
              }
              return artist;
            });
          }
          return user;
        }),
        catchError(this.handleError)
      );
  }

  getAuthenticatedUser(): Observable<UserGet> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<UserGet>(`${this.apiUrl}/me`, { headers })
      .pipe(
        map((user) => {
          if (user.urlFoto) {
            user.urlFoto = `${this.routesBack.userServiceUrl}/fotos/image/${user.urlFoto}`;
          }
          return user;
        }),
        catchError(this.handleError)
      );
  }

  private handleError(error: any): Observable<never> {
    console.error('UserExperienceService error:', error);
    return throwError(() => error);
  }
}
