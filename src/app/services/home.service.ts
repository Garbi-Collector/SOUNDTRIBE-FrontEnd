import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {ResponseAlbumDto, ResponseSongDto} from '../dtos/albumes/musics.response.dto';
import { BackEndRoutesService } from '../back-end.routes.service';

@Injectable({
  providedIn: 'root'
})
export class HomeService {

  constructor(
    private http: HttpClient,
    private backEndRoutes: BackEndRoutesService
  ) {}

  /**
   * Obtener los 10 álbumes más recientes
   */
  getAlbumesRecientes(): Observable<ResponseAlbumDto[]> {
    return this.http.get<ResponseAlbumDto[]>(`${this.backEndRoutes.musicServiceUrl}/api/home/albumes-recientes`);
  }

  /**
   * Obtener los 10 álbumes más votados
   */
  getAlbumesMasVotados(): Observable<ResponseAlbumDto[]> {
    return this.http.get<ResponseAlbumDto[]>(`${this.backEndRoutes.musicServiceUrl}/api/home/albumes-mas-votados`);
  }

  /**
   * Obtener los 10 álbumes más escuchados
   */
  getAlbumesMasEscuchados(): Observable<ResponseAlbumDto[]> {
    return this.http.get<ResponseAlbumDto[]>(`${this.backEndRoutes.musicServiceUrl}/api/home/albumes-mas-escuchados`);
  }

  /**
   * Obtener 10 canciones "on fire"
   */
  getCancionesOnFire(): Observable<ResponseSongDto[]> {
    return this.http.get<ResponseSongDto[]>(`${this.backEndRoutes.musicServiceUrl}/api/home/canciones-onfire`);
  }

  /**
   * Obtener 10 canciones más likeadas
   */
  getCancionesMasLikeadas(): Observable<ResponseSongDto[]> {
    return this.http.get<ResponseSongDto[]>(`${this.backEndRoutes.musicServiceUrl}/api/home/canciones-mas-likeadas`);
  }

  /**
   * Obtener el álbum al que pertenece una canción específica, para poder sacar la foto de su album
   * @param idSong ID de la canción
   */
  getAlbumBySong(idSong: number): Observable<ResponseAlbumDto> {
    return this.http.get<ResponseAlbumDto>(`${this.backEndRoutes.musicServiceUrl}/api/home/album-de-cancion/${idSong}`);
  }
}
