import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, timer } from 'rxjs';
import { catchError, shareReplay, switchMap, tap } from 'rxjs/operators';
import { ResponseAlbumDto, ResponseSongDto } from '../dtos/albumes/musics.response.dto';
import { BackEndRoutesService } from '../back-end.routes.service';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class HomeService {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hora en milisegundos

  constructor(
    private http: HttpClient,
    private backEndRoutes: BackEndRoutesService
  ) {}

  /**
   * Método genérico para manejar el cache
   */
  private getCachedData<T>(key: string, apiCall: () => Observable<T>): Observable<T> {
    const cachedEntry = this.cache.get(key);
    const now = Date.now();

    // Si existe en cache y no ha expirado, devolver datos cacheados
    if (cachedEntry && (now - cachedEntry.timestamp) < this.CACHE_DURATION) {
      return of(cachedEntry.data);
    }

    // Si no existe o ha expirado, hacer la llamada a la API
    return apiCall().pipe(
      tap(data => {
        // Guardar en cache
        this.cache.set(key, {
          data: data,
          timestamp: now
        });
      }),
      shareReplay(1) // Compartir el resultado para evitar múltiples llamadas simultáneas
    );
  }

  /**
   * Limpiar cache manualmente (opcional)
   */
  clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Obtener los 10 álbumes más recientes
   */
  getAlbumesRecientes(): Observable<ResponseAlbumDto[]> {
    return this.getCachedData(
      'albumes-recientes',
      () => this.http.get<ResponseAlbumDto[]>(`${this.backEndRoutes.musicServiceUrl}/api/home/albumes-recientes`)
    );
  }

  /**
   * Obtener los 10 álbumes más votados
   */
  getAlbumesMasVotados(): Observable<ResponseAlbumDto[]> {
    return this.getCachedData(
      'albumes-mas-votados',
      () => this.http.get<ResponseAlbumDto[]>(`${this.backEndRoutes.musicServiceUrl}/api/home/albumes-mas-votados`)
    );
  }

  /**
   * Obtener los 10 álbumes más escuchados
   */
  getAlbumesMasEscuchados(): Observable<ResponseAlbumDto[]> {
    return this.getCachedData(
      'albumes-mas-escuchados',
      () => this.http.get<ResponseAlbumDto[]>(`${this.backEndRoutes.musicServiceUrl}/api/home/albumes-mas-escuchados`)
    );
  }

  /**
   * Obtener 10 canciones "on fire"
   */
  getCancionesOnFire(): Observable<ResponseSongDto[]> {
    return this.getCachedData(
      'canciones-onfire',
      () => this.http.get<ResponseSongDto[]>(`${this.backEndRoutes.musicServiceUrl}/api/home/canciones-onfire`)
    );
  }

  /**
   * Obtener 10 canciones más likeadas
   */
  getCancionesMasLikeadas(): Observable<ResponseSongDto[]> {
    return this.getCachedData(
      'canciones-mas-likeadas',
      () => this.http.get<ResponseSongDto[]>(`${this.backEndRoutes.musicServiceUrl}/api/home/canciones-mas-likeadas`)
    );
  }

  /**
   * Obtener el álbum al que pertenece una canción específica
   * @param idSong ID de la canción
   */
  getAlbumBySong(idSong: number): Observable<ResponseAlbumDto> {
    return this.getCachedData(
      `album-song-${idSong}`,
      () => this.http.get<ResponseAlbumDto>(`${this.backEndRoutes.musicServiceUrl}/api/home/album-de-cancion/${idSong}`)
    );
  }
}
