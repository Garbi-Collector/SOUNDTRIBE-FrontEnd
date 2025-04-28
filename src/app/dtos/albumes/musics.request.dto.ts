export interface RequestSongDto {
  name: string;
  description: string;
  genero: number[];
  subgenero: number[];
  estilo: number[];
  artistasFt: number[];
  file: File; // ahora este "file" sí lo vamos a usar bien
}

export interface RequestAlbumDto {
  name: string;
  description: string;
  typeAlbum: string;
  portada: File;
  songs: RequestSongDto[];
}
