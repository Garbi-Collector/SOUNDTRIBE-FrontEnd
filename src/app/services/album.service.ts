import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BackEndRoutesService } from '../back-end.routes.service';
import { AuthService } from '../services/auth.service';
import { ResponseAlbumDto } from '../dtos/albumes/musics.response.dto';
import { RequestAlbumDto } from '../dtos/albumes/musics.request.dto';

@Injectable({
  providedIn: 'root'
})
export class AlbumService {
  constructor(
    private http: HttpClient,
    private backEndRoutes: BackEndRoutesService,
    private authService: AuthService
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

    // Logs de depuración (pueden quedarse si querés)
    console.log('Token enviado:', token);
    console.log('Headers enviados:', headers);
    console.log('FormData enviado:');
    formData.forEach((value, key) => {
      console.log(`Campo '${key}':`, value);
    });

    // Hacemos la llamada
    return this.http.post<ResponseAlbumDto>(`${this.backEndRoutes.musicServiceUrl}/album/upload`, formData, { headers });
  }






  /**
   * Obtener todos los álbumes de un artista por su ID
   * @param ownerId El ID del artista
   * @returns Lista de álbumes del artista
   */
  getAlbumsByArtist(ownerId: number): Observable<ResponseAlbumDto[]> {
    return this.http.get<ResponseAlbumDto[]>(`${this.backEndRoutes.musicServiceUrl}/album/artist/${ownerId}`);
  }
}
