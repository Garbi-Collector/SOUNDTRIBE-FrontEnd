export interface ResponseEstiloDto {
  id: number;
  name: string;
  description: string;
}

export interface ResponseSubgeneroDto {
  id: number;
  name: string;
  description: string;
}

export interface ResponseGeneroDto {
  id: number;
  name: string;
  description: string;
}

export interface ResponsePortadaDto {
  id: number;
  fileName: string;
  fileUrl: string;
}

export enum TypeAlbum {
  EP = 'EP',
  LP = 'LP',
  SINGLE = 'SINGLE'
}

export interface ResponseSongDto {
  id: number;
  name: string;
  description: string;
  duration: number;
  owner: number;
  fileUrl: string;
  genero: ResponseGeneroDto[];
  subgenero: ResponseSubgeneroDto[];
  estilo: ResponseEstiloDto[];
  artistasFt: number[];
}

export interface ResponseAlbumDto {
  id: number;
  name: string;
  description: string;
  typeAlbum: TypeAlbum;
  portada: ResponsePortadaDto;
  songs: ResponseSongDto[];
  owner: number;
}




