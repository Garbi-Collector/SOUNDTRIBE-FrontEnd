// src/app/services/explore.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseAlbumDto, ResponseSongPortadaDto } from '../dtos/albumes/musics.response.dto';
import {BackEndRoutesService} from "../back-end.routes.service";

@Injectable({
  providedIn: 'root'
})
export class ExploreService {

  private readonly exploreUrl: string;

  constructor(
    private http: HttpClient,
    private backEndRoutes: BackEndRoutesService
  ) {
    this.exploreUrl = `${this.backEndRoutes.musicServiceUrl}/api/explore`;
  }

  /**
   * Explora álbumes con filtros opcionales
   * @param name Nombre del álbum a buscar (opcional)
   * @param genero ID del género a filtrar (opcional)
   * @returns Observable con lista de álbumes filtrados
   */
  explorarAlbumes(name?: string, genero?: number): Observable<ResponseAlbumDto[]> {
    let params = new HttpParams();

    if (name && name.trim()) {
      params = params.set('name', name.trim());
    }

    if (genero !== undefined && genero !== null) {
      params = params.set('genero', genero.toString());
    }

    return this.http.get<ResponseAlbumDto[]>(`${this.exploreUrl}/albums`, { params });
  }

  /**
   * Explora canciones con filtros opcionales
   * @param name Nombre de la canción a buscar (opcional)
   * @param genero ID del género a filtrar (opcional)
   * @returns Observable con lista de canciones filtradas
   */
  explorarCanciones(name?: string, genero?: number): Observable<ResponseSongPortadaDto[]> {
    let params = new HttpParams();

    if (name && name.trim()) {
      params = params.set('name', name.trim());
    }

    if (genero !== undefined && genero !== null) {
      params = params.set('genero', genero.toString());
    }

    return this.http.get<ResponseSongPortadaDto[]>(`${this.exploreUrl}/songs`, { params });
  }

  /**
   * Método de conveniencia para buscar álbumes solo por nombre
   * @param name Nombre del álbum
   * @returns Observable con lista de álbumes
   */
  buscarAlbumesPorNombre(name: string): Observable<ResponseAlbumDto[]> {
    return this.explorarAlbumes(name);
  }

  /**
   * Método de conveniencia para buscar canciones solo por nombre
   * @param name Nombre de la canción
   * @returns Observable con lista de canciones
   */
  buscarCancionesPorNombre(name: string): Observable<ResponseSongPortadaDto[]> {
    return this.explorarCanciones(name);
  }

  /**
   * Método de conveniencia para obtener álbumes por género
   * @param genero ID del género
   * @returns Observable con lista de álbumes
   */
  obtenerAlbumesPorGenero(genero: number): Observable<ResponseAlbumDto[]> {
    return this.explorarAlbumes(undefined, genero);
  }

  /**
   * Método de conveniencia para obtener canciones por género
   * @param genero ID del género
   * @returns Observable con lista de canciones
   */
  obtenerCancionesPorGenero(genero: number): Observable<ResponseSongPortadaDto[]> {
    return this.explorarCanciones(undefined, genero);
  }

  /**
   * Obtiene álbumes populares (sin filtros)
   * @returns Observable con lista de álbumes más populares
   */
  obtenerAlbunesPopulares(): Observable<ResponseAlbumDto[]> {
    return this.explorarAlbumes();
  }

  /**
   * Obtiene canciones populares (sin filtros)
   * @returns Observable con lista de canciones más populares
   */
  obtenerCancionesPopulares(): Observable<ResponseSongPortadaDto[]> {
    return this.explorarCanciones();
  }
}
