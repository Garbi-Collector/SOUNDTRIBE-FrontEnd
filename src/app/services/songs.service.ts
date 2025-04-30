import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BackEndRoutesService } from "../back-end.routes.service";
import { VoteMessage } from "../dtos/albumes/songs.dto";

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
   * obtiene el archivo .wav de una cancion por su id
   * @param id
   */
  reproducirCancionPorId(id: number): Observable<Blob> {
    const url = `${this.filesUrl}/play/${id}`;
    return this.http.get(url, { responseType: 'blob' }); // para obtener audio como Blob
  }
}
