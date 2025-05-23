import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BackEndRoutesService } from "../back-end.routes.service";
import { VoteMessage, VoteType } from "../dtos/albumes/songs.dto";

@Injectable({
  providedIn: 'root'
})
export class SongsService {

  private readonly votesUrl: string;
  private readonly filesUrl: string;

  constructor(private http: HttpClient, private backEndRoutes: BackEndRoutesService) {
    this.votesUrl = `${this.backEndRoutes.musicServiceUrl}/votes`;
    this.filesUrl = `${this.backEndRoutes.musicServiceUrl}/files`; // base para portada y play
  }

  /**
   * sirve para darle un voto a una cancion por su id
   * en caso de ya haberle dado un tipo de voto, se le
   * borra el anterior dado y se actualiza con el nuevo voto
   * @param voteMessage
   */
  votar(voteMessage: VoteMessage): Observable<any> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No se encontró el token JWT');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post<any>(this.votesUrl, voteMessage, { headers });
  }

  /**
   * si el usuario toca de vuelta el Mg o Nmg (el voto respectivo que le haya dado)
   * ese voto de elimina del back (y en teoria visualmente)
   * @param songId
   */
  eliminarVoto(songId: number): Observable<string> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No se encontró el token JWT');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.delete<string>(`${this.votesUrl}?songId=${songId}`, { headers });
  }

  /**
   * obtiene la foto .png de una portada por su id
   * @param id
   */
  obtenerPortadaPorId(id: number): Observable<Blob> {
    const url = `${this.filesUrl}/portada/${id}`;
    return this.http.get(url, { responseType: 'blob' }); // para obtener imagen como Blob
  }

  /**
   * obtiene el archivo .wav de una cancion por su id (método legacy)
   * @param id
   * @deprecated Usar getStreamingUrl() para streaming optimizado
   */
  reproducirCancionPorId(id: number): Observable<Blob> {
    const url = `${this.filesUrl}/play/${id}`;
    return this.http.get(url, { responseType: 'blob' }); // para obtener audio como Blob
  }

  /**
   * Obtiene la URL de streaming para una canción específica
   * Esta URL soporta HTTP Range Requests para streaming progresivo
   * @param id ID de la canción
   * @returns URL de streaming que puede ser usada directamente en el elemento audio
   */
  getStreamingUrl(id: number): string {
    // Agregar token de autorización como query parameter si es necesario
    const token = localStorage.getItem('auth_token');
    const baseUrl = `${this.filesUrl}/stream/${id}`;

    console.log('🌐 SongsService: Generando URL de streaming para canción', id);
    console.log('🔗 SongsService: URL base:', baseUrl);
    console.log('🔑 SongsService: Token disponible:', !!token);

    // Si tu backend requiere autenticación para el streaming, descomenta la siguiente línea:
    // return token ? `${baseUrl}?token=${token}` : baseUrl;

    const finalUrl = baseUrl;
    console.log('✅ SongsService: URL final de streaming:', finalUrl);
    return finalUrl;
  }

  /**
   * Obtiene la URL de reproducción directa (sin streaming optimizado)
   * @param id ID de la canción
   * @returns URL de reproducción directa
   */
  getPlayUrl(id: number): string {
    const token = localStorage.getItem('auth_token');
    const baseUrl = `${this.filesUrl}/play/${id}`;

    // Si tu backend requiere autenticación, descomenta la siguiente línea:
    // return token ? `${baseUrl}?token=${token}` : baseUrl;

    return baseUrl;
  }

  /**
   * Obtiene información sobre el progreso de descarga de una canción
   * Útil para mostrar el progreso de buffering
   * @param id ID de la canción
   * @param onProgress Callback que recibe el progreso de descarga
   */
  getDownloadProgress(id: number, onProgress: (loaded: number, total: number) => void): Observable<Blob> {
    const url = `${this.filesUrl}/stream/${id}`;

    // Crear un XMLHttpRequest personalizado para monitorear el progreso
    return new Observable(observer => {
      const xhr = new XMLHttpRequest();

      xhr.open('GET', url, true);
      xhr.responseType = 'blob';

      xhr.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(event.loaded, event.total);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 206) {
          observer.next(xhr.response);
          observer.complete();
        } else {
          observer.error(`Error: ${xhr.status}`);
        }
      };

      xhr.onerror = () => observer.error('Error de red');

      xhr.send();
    });
  }

  /**
   * Convierte segundos a un string en formato "minutos:segundos"
   * @param segundos
   * @returns string
   */
  formatearDuracion(segundos: number): string {
    const minutos = Math.floor(segundos / 60);
    const segundosRestantes = segundos % 60;
    const segundosFormateados = segundosRestantes < 10 ? '0' + segundosRestantes : segundosRestantes;
    return `${minutos}:${segundosFormateados}`;
  }

  /**
   * Verifica si el usuario ya votó una canción con un tipo de voto (LIKE o DISLIKE)
   * @param songId ID de la canción
   * @param voteType Tipo de voto (LIKE o DISLIKE)
   */
  isVoted(songId: number, voteType: VoteType): Observable<boolean> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No se encontró el token JWT');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const url = `${this.votesUrl}/${songId}/isvoted?vote=${voteType}`;
    return this.http.get<boolean>(url, { headers });
  }
}
