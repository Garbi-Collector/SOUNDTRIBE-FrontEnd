import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BackEndRoutesService } from '../back-end.routes.service';
import { Observable } from 'rxjs';
import {DashboardSong,DashboardGeneroTopGlobal,DashboardSubGeneroTopGlobal,DashboardEstiloTopGlobal} from "../dtos/dashboard/dashboard.dto";

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private baseUrl = this.backEndRoutes.musicServiceUrl + '/api/dashboard';

  constructor(
    private http: HttpClient,
    private backEndRoutes: BackEndRoutesService,
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token'); // o donde guardes tu JWT
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  /**
   * primero y principal para no hacer cargas de mas,
   * si el usuario no tiene canciones no va a
   * poder generar canciones, basicamente es un validador
   */
  haveSongs(): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}/have-songs`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * genera el numero de reproducciones que tiene un artista
   * en sesion, es basicamente un indicador o kpi por asi
   * decirlo
   */
  getPlayCount(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/play-count`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * devuelve una lista ordenada de top 10 canciones de
   * el artista en sesion, pero solo se debn mostrar las 5 mejores canciones
   * con un grafico de barras
   */
  getTopSongs(): Observable<DashboardSong[]> {
    return this.http.get<DashboardSong[]>(`${this.baseUrl}/top-songs`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * genero mas escuchado del artista (un grafico de
   * torta mostrando, de sus canciones, cual es
   * el genero mas reproducido) trae un porcentaje para poder hacer el grafico mas rapido
   */
  getGeneroMasEscuchado(): Observable<DashboardGeneroTopGlobal[]> {
    return this.http.get<DashboardGeneroTopGlobal[]>(`${this.baseUrl}/genero-mas-escuchado`, {
      headers: this.getAuthHeaders()
    });
  }

  //dashboards globales

  /**
   * trae el genero top 1 en la plataforma, se debera mostrar su mensaje de "festejo"
   */
  getGeneroTopGlobal(): Observable<DashboardGeneroTopGlobal> {
    return this.http.get<DashboardGeneroTopGlobal>(`${this.baseUrl}/genero-top-global`);
  }

  /**
   * trae el subgenero top 1 en la plataforma, se debera mostrar su mensaje de "festejo"
   */
  getSubGeneroTopGlobal(): Observable<DashboardSubGeneroTopGlobal> {
    return this.http.get<DashboardSubGeneroTopGlobal>(`${this.baseUrl}/subgenero-top-global`);
  }

  /**
   * trae el estilo top 1 en la plataforma, se debera mostrar su mensaje de "festejo"
   */
  getEstiloTopGlobal(): Observable<DashboardEstiloTopGlobal> {
    return this.http.get<DashboardEstiloTopGlobal>(`${this.baseUrl}/estilo-top-global`);
  }
}
