import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ResponseSongDto } from '../dtos/albumes/musics.response.dto';
import { SongsService } from './songs.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { UserDescription } from '../dtos/usuarios/users.dto';

export interface PlayerState {
  currentSong: ResponseSongDto | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  albumCover: SafeUrl | null;
  owner: UserDescription | null;
  featuredArtists: UserDescription[];
  queue: ResponseSongDto[];
  currentIndex: number;
}

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  private audio: HTMLAudioElement;
  private updateInterval: any;

  // Estado inicial del reproductor
  private initialState: PlayerState = {
    currentSong: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    albumCover: null,
    owner: null,
    featuredArtists: [],
    queue: [],
    currentIndex: -1
  };

  // BehaviorSubject para mantener y emitir el estado del reproductor
  private playerStateSubject = new BehaviorSubject<PlayerState>(this.initialState);
  public playerState$: Observable<PlayerState> = this.playerStateSubject.asObservable();

  constructor(
    private songsService: SongsService,
    private sanitizer: DomSanitizer
  ) {
    this.audio = new Audio();

    // Configurar eventos del elemento de audio
    this.audio.addEventListener('timeupdate', this.updateCurrentTime.bind(this));
    this.audio.addEventListener('loadedmetadata', this.handleMetadata.bind(this));
    this.audio.addEventListener('ended', this.handleSongEnd.bind(this));
    this.audio.addEventListener('error', this.handleError.bind(this));
  }

  // Obtener el estado actual del reproductor
  get currentState(): PlayerState {
    return this.playerStateSubject.getValue();
  }

  // Actualizar el estado del reproductor
  private updateState(newState: Partial<PlayerState>): void {
    this.playerStateSubject.next({ ...this.currentState, ...newState });
  }

  // Reproducir una canción
  playSong(song: ResponseSongDto, albumCover: SafeUrl | null, owner: UserDescription | null, featuredArtists: UserDescription[], queue: ResponseSongDto[] = [], currentIndex: number = 0): void {
    // Detener la reproducción actual si existe
    this.stopCurrentSong();

    // Obtener el archivo de audio
    this.songsService.reproducirCancionPorId(song.id).subscribe({
      next: (blob) => {
        // Crear URL para el blob de audio
        const audioUrl = URL.createObjectURL(blob);

        // Configurar el elemento de audio
        this.audio.src = audioUrl;
        this.audio.load();

        // Actualizar el estado con la nueva canción
        this.updateState({
          currentSong: song,
          albumCover,
          owner,
          featuredArtists,
          queue: queue.length > 0 ? queue : [song],
          currentIndex: queue.length > 0 ? currentIndex : 0,
          duration: song.duration,
          currentTime: 0
        });

        // Reproducir automáticamente
        this.play();
      },
      error: (err) => {
        console.error('Error cargando la canción:', err);
      }
    });
  }

  // Reproducir
  play(): void {
    if (this.audio.src) {
      this.audio.play().then(() => {
        this.updateState({ isPlaying: true });
      }).catch(error => {
        console.error('Error al reproducir:', error);
      });
    }
  }

  // Pausar
  pause(): void {
    this.audio.pause();
    this.updateState({ isPlaying: false });
  }

  // Alternar entre reproducir y pausar
  togglePlay(): void {
    if (this.currentState.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  // Detener la canción actual
  private stopCurrentSong(): void {
    this.audio.pause();
    this.audio.currentTime = 0;
    if (this.audio.src) {
      // Liberar recursos
      URL.revokeObjectURL(this.audio.src);
      this.audio.src = '';
    }
  }

  // Ir a la canción anterior
  previousTrack(): void {
    const { queue, currentIndex } = this.currentState;

    if (queue.length === 0) return;

    // Si estamos en los primeros 3 segundos de la canción, volvemos a empezar
    // Si no, vamos a la canción anterior si existe
    if (this.audio.currentTime > 3) {
      this.audio.currentTime = 0;
    } else if (currentIndex > 0) {
      const previousIndex = currentIndex - 1;
      const previousSong = queue[previousIndex];
      this.playSong(
        previousSong,
        this.currentState.albumCover,
        this.currentState.owner,
        this.currentState.featuredArtists,
        queue,
        previousIndex
      );
    }
  }

  // Ir a la siguiente canción
  nextTrack(): void {
    const { queue, currentIndex } = this.currentState;

    if (queue.length === 0) return;

    // Si hay una canción siguiente, reproducirla
    // Si estamos en la última canción, volver a la primera (comportamiento circular)
    if (currentIndex < queue.length - 1) {
      const nextIndex = currentIndex + 1;
      const nextSong = queue[nextIndex];
      this.playSong(
        nextSong,
        this.currentState.albumCover,
        this.currentState.owner,
        this.currentState.featuredArtists,
        queue,
        nextIndex
      );
    } else {
      // Estamos en la última canción, volver a la primera
      this.playSong(
        queue[0],
        this.currentState.albumCover,
        this.currentState.owner,
        this.currentState.featuredArtists,
        queue,
        0
      );
    }
  }

  // Buscar a una posición específica
  seek(percentage: number): void {
    if (this.audio.duration) {
      const seekTime = (percentage / 100) * this.audio.duration;
      this.audio.currentTime = seekTime;
    }
  }

  // Actualizar el tiempo de reproducción actual
  private updateCurrentTime(): void {
    this.updateState({
      currentTime: this.audio.currentTime
    });
  }

  // Manejar los metadatos cargados
  private handleMetadata(): void {
    this.updateState({
      duration: this.audio.duration
    });
  }

// Manejar el final de la canción
  private handleSongEnd(): void {
    // Al finalizar la canción, ir a la siguiente (con comportamiento circular)
    this.nextTrack();
  }

  private handleError(event: Event): void {
    const mediaError = (event.target as HTMLAudioElement).error;
    if (mediaError) {
      console.error('Error al reproducir audio:', mediaError.code);
      switch (mediaError.code) {
        case mediaError.MEDIA_ERR_ABORTED:
          console.error('La reproducción fue cancelada por el usuario.');
          break;
        case mediaError.MEDIA_ERR_NETWORK:
          console.error('Hubo un error de red al descargar el archivo de audio.');
          break;
        case mediaError.MEDIA_ERR_DECODE:
          console.error('Hubo un error al decodificar el archivo de audio.');
          break;
        case mediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          console.error('El formato de audio no es compatible o no se pudo encontrar el archivo.');
          break;
        default:
          console.error('Error desconocido al intentar reproducir el audio.');
          break;
      }
    }
  }


  // Formatear segundos a formato mm:ss
  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }
}
