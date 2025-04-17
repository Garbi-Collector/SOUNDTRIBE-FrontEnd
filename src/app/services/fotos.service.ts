import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RoutesBackService } from '../../routes-back.service';
import { AuthService } from './auth.service';

export interface FotoModel {
  id: number;
  fileName: string;
  fileType: string;
  fileUrl: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class FotosService {
  private apiUrl: string;

  constructor(
    private http: HttpClient,
    private routesBack: RoutesBackService,
    private authService: AuthService
  ) {
    this.apiUrl = `${this.routesBack.userServiceUrl}/fotos`;
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  /**
   * Sube una imagen al backend (multipart/form-data)
   * @param file Archivo a subir
   */
  uploadFoto(file: File): Observable<FotoModel> {
    const headers = this.getAuthHeaders();
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<FotoModel>(this.apiUrl, formData, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtener una imagen por ID
   * @param id ID de la imagen
   */
  getFotoById(id: number): Observable<Blob> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/${id}`, { headers, responseType: 'blob' }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtener una imagen por nombre de archivo (filename)
   * @param filename Nombre del archivo
   */
  getFotoByFilename(filename: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/image/${filename}`, { responseType: 'blob' }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any): Observable<never> {
    console.error('FotosService error:', error);
    return throwError(() => error);
  }
}
