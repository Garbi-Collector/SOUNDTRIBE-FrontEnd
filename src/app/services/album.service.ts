import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BackEndRoutesService } from '../back-end.routes.service';
import { ResponseAlbumDto } from '../dtos/albumes/musics.response.dto';
import { RequestAlbumDto } from '../dtos/albumes/musics.request.dto';

@Injectable({
  providedIn: 'root'
})
export class AlbumService {
  constructor(
    private http: HttpClient,
    private backEndRoutes: BackEndRoutesService,
  ) {}





  /**
   * Subir un nuevo álbum con su portada y canciones
   * @param albumDto Contiene la información del álbum
   * @returns El álbum creado
   */
  uploadAlbum(albumDto: RequestAlbumDto): Observable<ResponseAlbumDto> {
    const token = localStorage.getItem('auth_token'); // <-- CAMBIO AQUÍ

    if (!token) {
      throw new Error('No se encontró el token JWT');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const formData = new FormData();

    // Crear el objeto del álbum
    const uploadAlbumDto = {
      name: albumDto.name,
      description: albumDto.description,
      typeAlbum: albumDto.typeAlbum,
      songs: albumDto.songs.map(song => ({
        name: song.name,
        description: song.description,
        genero: song.genero,
        subgenero: song.subgenero,
        estilo: song.estilo,
        artistasFt: song.artistasFt
      }))
    };

    // Agregamos el JSON del álbum
    formData.append('album', new Blob([JSON.stringify(uploadAlbumDto)], { type: 'application/json' }));

    // Agregamos la portada
    formData.append('portada', albumDto.portada);

    // Agregamos los archivos de las canciones
    albumDto.songs.forEach((song, index) => {
      formData.append('files', song.file);
    });


    // Hacemos la llamada
    return this.http.post<ResponseAlbumDto>(`${this.backEndRoutes.musicServiceUrl}/album/upload`, formData, { headers });
  }

  /**
   * Hace like o unlike a un álbum por su ID
   * @param idAlbum ID del álbum
   * @returns Observable con el mensaje de respuesta del backend
   */
  likeOrUnlikeAlbum(idAlbum: number): Observable<string> {
    const token = localStorage.getItem('auth_token');

    if (!token) {
      throw new Error('No se encontró el token JWT');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post(`${this.backEndRoutes.musicServiceUrl}/album/${idAlbum}/like`, null, {
      headers,
      responseType: 'text' // porque el backend devuelve un string
    });
  }



  /**
   * Obtener un álbum por su slug
   * @param slug Slug del álbum
   * @returns Álbum correspondiente al slug
   */
  getAlbumBySlug(slug: string): Observable<ResponseAlbumDto> {
    return this.http.get<ResponseAlbumDto>(`${this.backEndRoutes.musicServiceUrl}/album/slug/${slug}`);
  }


  /**
   * Obtener todos los álbumes de un artista por su ID
   * @param ownerId El ID del artista
   * @returns Lista de álbumes del artista
   */
  getAlbumsByArtist(ownerId: number): Observable<ResponseAlbumDto[]> {
    return this.http.get<ResponseAlbumDto[]>(`${this.backEndRoutes.musicServiceUrl}/album/artist/${ownerId}`);
  }

  /**
   * Verifica si el álbum ya fue likeado por el usuario autenticado
   * @param idAlbum ID del álbum
   * @returns `true` si ya le dio like, `false` si no
   */
  isAlbumLiked(idAlbum: number): Observable<boolean> {
    const token = localStorage.getItem('auth_token');

    if (!token) {
      throw new Error('No se encontró el token JWT');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<boolean>(
      `${this.backEndRoutes.musicServiceUrl}/album/${idAlbum}/isliked`,
      { headers }
    );
  }

  /**
   * Obtiene la cantidad de likes de un álbum
   * @param idAlbum ID del álbum
   * @returns Número de likes
   */
  getLikesCount(idAlbum: number): Observable<number> {
    return this.http.get<number>(
      `${this.backEndRoutes.musicServiceUrl}/album/${idAlbum}/likescount`
    );
  }


}
