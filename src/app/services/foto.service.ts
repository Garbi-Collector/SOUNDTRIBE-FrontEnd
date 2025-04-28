import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {AuthService} from "./auth.service";
import {BackEndRoutesService} from "../back-end.routes.service";
import {catchError, Observable, throwError} from "rxjs";
import {FotoModel} from "../dtos/usuarios/fotos.dto";

@Injectable({
  providedIn: 'root'
})
export class FotoService {
  private apiUrl: string;

  constructor(
    private http: HttpClient,
    private backEndRoutes: BackEndRoutesService,
    private authService: AuthService
  ) {
    this.apiUrl = `${this.backEndRoutes.userServiceUrl}/fotos`;
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
