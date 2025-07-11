// src/app/dtos/albumes/musics.response.dto.ts
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

export enum TypeAlbum {
  EP = 'EP',
  LP = 'LP',
  SINGLE = 'SINGLE'
}

export interface ResponsePortadaDto {
  id: number;
  fileName: string;
  fileUrl: string; //url para buscarlo
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
  slug: string;
  artistasFt: number[];
  likes: number;  // Número de likes
  dislikes: number;  // Número de dislikes
  playCount: number;
}

export interface ResponseSongPortadaDto {
  id: number;
  name: string;
  description: string;
  duration: number;
  owner: number;
  fileUrl: string;
  genero: ResponseGeneroDto[];
  subgenero: ResponseSubgeneroDto[];
  estilo: ResponseEstiloDto[];
  slug: string;
  artistasFt: number[];
  likes: number;  // Número de likes
  dislikes: number;  // Número de dislikes
  playCount: number;
  portada: ResponsePortadaDto;
}


export interface ResponseAlbumDto {
  id: number;
  name: string;
  description: string;
  typeAlbum: TypeAlbum;
  portada: ResponsePortadaDto;
  songs: ResponseSongDto[];
  owner: number;
  slug: string;
  likeCount: number;
  duration: number;
  allPlaysCount: number;
}
