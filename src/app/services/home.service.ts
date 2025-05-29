import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, from } from 'rxjs';
import { switchMap, tap, shareReplay } from 'rxjs/operators';
import { BackEndRoutesService } from '../back-end.routes.service';
import { PersistentCacheService } from './persistent-cache.service'; // <-- nuevo
import { ResponseAlbumDto, ResponseSongDto } from '../dtos/albumes/musics.response.dto';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class HomeService {
  private memoryCache = new Map<string, CacheEntry<any>>();

  constructor(
    private http: HttpClient,
    private backEndRoutes: BackEndRoutesService,
    private persistentCache: PersistentCacheService
  ) {}

  private getDuration(key: string): number {
    return key === 'albumes-recientes' ? 5 * 60 * 1000 : 60 * 60 * 1000;
  }

  private getCachedData<T>(key: string, apiCall: () => Observable<T>): Observable<T> {
    const now = Date.now();
    const duration = this.getDuration(key);

    // 1. Ver memoria
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && (now - memoryEntry.timestamp) < duration) {
      return of(memoryEntry.data);
    }

    // 2. Ver IndexedDB
    return from(this.persistentCache.get<T>(key)).pipe(
      switchMap(persistentEntry => {
        if (persistentEntry && (now - persistentEntry.timestamp) < duration) {
          // Guardar en memoria para la próxima vez
          this.memoryCache.set(key, persistentEntry);
          return of(persistentEntry.data);
        }

        // 3. Llamada HTTP si no está en cache o expiró
        return apiCall().pipe(
          tap(data => {
            const newEntry: CacheEntry<T> = { data, timestamp: now };
            this.memoryCache.set(key, newEntry);
            this.persistentCache.set<T>(key, newEntry);
          })
        );
      }),
      shareReplay(1)
    );
  }

  // Métodos públicos (sin cambios excepto el uso del nuevo cache)
  getAlbumesRecientes(): Observable<ResponseAlbumDto[]> {
    return this.getCachedData(
      'albumes-recientes',
      () => this.http.get<ResponseAlbumDto[]>(`${this.backEndRoutes.musicServiceUrl}/api/home/albumes-recientes`)
    );
  }

  getAlbumesMasVotados(): Observable<ResponseAlbumDto[]> {
    return this.getCachedData(
      'albumes-mas-votados',
      () => this.http.get<ResponseAlbumDto[]>(`${this.backEndRoutes.musicServiceUrl}/api/home/albumes-mas-votados`)
    );
  }

  getAlbumesMasEscuchados(): Observable<ResponseAlbumDto[]> {
    return this.getCachedData(
      'albumes-mas-escuchados',
      () => this.http.get<ResponseAlbumDto[]>(`${this.backEndRoutes.musicServiceUrl}/api/home/albumes-mas-escuchados`)
    );
  }

  getCancionesOnFire(): Observable<ResponseSongDto[]> {
    return this.getCachedData(
      'canciones-onfire',
      () => this.http.get<ResponseSongDto[]>(`${this.backEndRoutes.musicServiceUrl}/api/home/canciones-onfire`)
    );
  }

  getCancionesMasLikeadas(): Observable<ResponseSongDto[]> {
    return this.getCachedData(
      'canciones-mas-likeadas',
      () => this.http.get<ResponseSongDto[]>(`${this.backEndRoutes.musicServiceUrl}/api/home/canciones-mas-likeadas`)
    );
  }

  getAlbumBySong(idSong: number): Observable<ResponseAlbumDto> {
    return this.getCachedData(
      `album-song-${idSong}`,
      () => this.http.get<ResponseAlbumDto>(`${this.backEndRoutes.musicServiceUrl}/api/home/album-de-cancion/${idSong}`)
    );
  }

  async clearAllCache() {
    this.memoryCache.clear();
    await this.persistentCache.clear();
  }

  startAutoClearCache() {
    const fiveHours = 2 * 60 * 60 * 1000; // 5 horas en milisegundos

    setInterval(() => {
      this.clearAllCache().then(() => {

      }).catch(err => {
        console.error('Error eliminando cache automáticamente:', err);
      });
    }, fiveHours);
  }


}
