// src/app/services/categoria.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BackEndRoutesService } from '../back-end.routes.service';
import { ResponseGeneroDto, ResponseSubgeneroDto, ResponseEstiloDto } from '../dtos/albumes/musics.response.dto';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service'; // Add this import

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  private apiUrl: string;

  constructor(
    private http: HttpClient,
    private backEndRoutes: BackEndRoutesService,
    private authService: AuthService // Add this dependency
  ) {
    this.apiUrl = `${this.backEndRoutes.musicServiceUrl}/api/categorias`;
  }

  // Add this helper method
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) {
      console.warn('No authentication token found');
      return new HttpHeaders();
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Obtener todos los géneros disponibles.
   * Endpoint: GET /api/categorias/generos
   */
  getAllGeneros(): Observable<ResponseGeneroDto[]> {
    return this.http.get<ResponseGeneroDto[]>(`${this.apiUrl}/generos`, {
      headers: this.getAuthHeaders() // Add headers here
    }).pipe(catchError(this.handleError));
  }

  /**
   * Obtener todos los subgéneros basados en un ID de género.
   * Endpoint: GET /api/categorias/generos/{generoId}/subgeneros
   */
  getSubgenerosByGeneroId(generoId: number): Observable<ResponseSubgeneroDto[]> {
    // Asegurarse de que generoId sea un número
    const id = typeof generoId === 'string' ? parseInt(generoId, 10) : generoId;


    return this.http.get<ResponseSubgeneroDto[]>(`${this.apiUrl}/generos/${id}/subgeneros`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError((error) => {
        console.error(`Error fetching subgenres for genreId ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener todos los estilos musicales.
   * Endpoint: GET /api/categorias/estilos
   */
  getAllEstilos(): Observable<ResponseEstiloDto[]> {
    return this.http.get<ResponseEstiloDto[]>(`${this.apiUrl}/estilos`, {
      headers: this.getAuthHeaders() // Add headers here
    }).pipe(catchError(this.handleError));
  }

  /**
   * Manejo de errores comunes para las llamadas HTTP.
   */
  private handleError(error: any) {
    console.error('Error en CategoriaService:', error);
    return throwError(() => error);
  }
}
