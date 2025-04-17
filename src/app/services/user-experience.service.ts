import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface UserGet {
  id: number;
  username: string;
  urlFoto: string;
}

export interface UserDescription {
  username: string;
  description: string;
  rol: string;
  urlimage: string;
  createdAt: string;
  artistasSeguidos: UserGet[];
}

export interface GetAll {
  usuarios: UserGet[];
}

@Injectable({
  providedIn: 'root'
})
export class UserExperienceService {
  private apiUrl = 'http://localhost:8080/api/user';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  followUser(idToFollow: number): Observable<string> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/follow/${idToFollow}`, null, { headers, responseType: 'text' })
      .pipe(catchError(this.handleError));
  }

  getAllUsers(): Observable<GetAll> {
    return this.http.get<GetAll>(`${this.apiUrl}/all`)
      .pipe(catchError(this.handleError));
  }

  getUserDescription(id: number): Observable<UserDescription> {
    return this.http.get<UserDescription>(`${this.apiUrl}/perfil/${id}`)
      .pipe(catchError(this.handleError));
  }

  getMyDescription(): Observable<UserDescription> {
    const headers = this.getAuthHeaders();
    return this.http.get<UserDescription>(`${this.apiUrl}/mi-perfil`, { headers })
      .pipe(catchError(this.handleError));
  }

  getAuthenticatedUser(): Observable<UserGet> {
    const headers = this.getAuthHeaders();
    return this.http.get<UserGet>(`${this.apiUrl}/me`, { headers })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any): Observable<never> {
    console.error('UserExperienceService error:', error);
    return throwError(() => error);
  }
}
