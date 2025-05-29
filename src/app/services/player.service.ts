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
  isLoading: boolean;
  bufferedTime: number;
  volume: number; // Añadido: nivel de volumen (0-100)
  isMuted: boolean; // Añadido: estado de silencio
  isFromCache: boolean; // Nuevo: indica si la canción actual viene del caché
  cacheStatus: 'loading' | 'cached' | 'streaming' | 'error'; // Nuevo: estado del caché
}

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  private audio: HTMLAudioElement;
  private updateInterval: any;
  private isChangingSong = false;
  private previousVolume = 50; // Para recordar el volumen antes de silenciar

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
    currentIndex: -1,
    isLoading: false,
    bufferedTime: 0,
    volume: 50, // Volumen inicial al 50%
    isMuted: false,
    isFromCache: false,
    cacheStatus: 'streaming'
  };

  // BehaviorSubject para mantener y emitir el estado del reproductor
  private playerStateSubject = new BehaviorSubject<PlayerState>(this.initialState);
  public playerState$: Observable<PlayerState> = this.playerStateSubject.asObservable();

  constructor(
    private songsService: SongsService,
    private sanitizer: DomSanitizer
  ) {
    this.audio = new Audio();
    // Configurar volumen inicial
    this.audio.volume = 0.5; // 50%

    // Configurar eventos del elemento de audio
    this.audio.addEventListener('timeupdate', this.updateCurrentTime.bind(this));
    this.audio.addEventListener('loadedmetadata', this.handleMetadata.bind(this));
    this.audio.addEventListener('ended', this.handleSongEnd.bind(this));
    this.audio.addEventListener('error', this.handleError.bind(this));
    this.audio.addEventListener('loadstart', this.handleLoadStart.bind(this));
    this.audio.addEventListener('canplay', this.handleCanPlay.bind(this));
    this.audio.addEventListener('waiting', this.handleWaiting.bind(this));
    this.audio.addEventListener('playing', this.handlePlaying.bind(this));
    this.audio.addEventListener('progress', this.updateBufferedTime.bind(this));
    this.audio.addEventListener('volumechange', this.handleVolumeChange.bind(this));
    // Configurar preload para streaming optimizado
    this.audio.preload = 'metadata';
  }

  // Obtener el estado actual del reproductor
  get currentState(): PlayerState {
    return this.playerStateSubject.getValue();
  }

  // Actualizar el estado del reproductor
  private updateState(newState: Partial<PlayerState>): void {
    this.playerStateSubject.next({ ...this.currentState, ...newState });
  }

  // MÉTODOS DE CONTROL DE VOLUMEN

  // Cambiar el volumen (0-100)
  setVolume(volume: number): void {
    // Validar rango
    const clampedVolume = Math.max(0, Math.min(100, volume));


    // Actualizar el elemento de audio (HTMLAudioElement usa 0-1)
    this.audio.volume = clampedVolume / 100;

    // Si el volumen es 0, marcar como silenciado
    if (clampedVolume === 0) {
      this.updateState({ volume: clampedVolume, isMuted: true });
    } else {
      // Si había volumen y estaba silenciado, quitarle el mute
      this.updateState({
        volume: clampedVolume,
        isMuted: false
      });
    }
  }

  // Aumentar volumen en incrementos (por defecto 10%)
  increaseVolume(increment: number = 10): void {
    const currentVolume = this.currentState.volume;
    const newVolume = Math.min(100, currentVolume + increment);

    this.setVolume(newVolume);
  }

  // Disminuir volumen en incrementos (por defecto 10%)
  decreaseVolume(increment: number = 10): void {
    const currentVolume = this.currentState.volume;
    const newVolume = Math.max(0, currentVolume - increment);

    this.setVolume(newVolume);
  }

  // Alternar silencio
  toggleMute(): void {


    if (this.currentState.isMuted) {
      // Restaurar volumen anterior

      this.setVolume(this.previousVolume);
    } else {
      // Guardar volumen actual y silenciar
      this.previousVolume = this.currentState.volume;

      this.audio.volume = 0;
      this.updateState({ isMuted: true });
    }
  }

  // Silenciar
  mute(): void {
    if (!this.currentState.isMuted) {

      this.previousVolume = this.currentState.volume;
      this.audio.volume = 0;
      this.updateState({ isMuted: true });
    }
  }

  // Quitar silencio
  unmute(): void {
    if (this.currentState.isMuted) {

      this.setVolume(this.previousVolume);
    }
  }

  // Event handler para cambios de volumen
  private handleVolumeChange(): void {
    const audioVolume = Math.round(this.audio.volume * 100);


    // Sincronizar estado si cambió externamente
    if (audioVolume !== this.currentState.volume) {
      this.updateState({
        volume: audioVolume,
        isMuted: audioVolume === 0
      });
    }
  }

  // Reproducir una canción usando streaming
  playSong(
    song: ResponseSongDto,
    albumCover: SafeUrl | null,
    owner: UserDescription | null,
    featuredArtists: UserDescription[],
    queue: ResponseSongDto[] = [],
    currentIndex: number = 0
  ): void {


    // Marcar que estamos cambiando de canción
    this.isChangingSong = true;

    // Detener la reproducción actual si existe
    this.stopCurrentSong();

    // Mostrar estado de carga
    this.updateState({
      isLoading: true,
      currentSong: song,
      albumCover,
      owner,
      featuredArtists,
      queue: queue.length > 0 ? queue : [song],
      currentIndex: queue.length > 0 ? currentIndex : 0,
      duration: song.duration,
      currentTime: 0,
      bufferedTime: 0,
      isPlaying: false
    });

    // Obtener la URL de streaming directamente
    const streamUrl = this.songsService.getStreamingUrl(song.id);

    // Configurar el elemento de audio con la URL de streaming
    this.audio.src = streamUrl;
    this.audio.load();

    // Marcar que ya no estamos en proceso de cambio después de un pequeño delay
    setTimeout(() => {
      this.isChangingSong = false;

    }, 10);
  }

  // Reproducir
  play(): void {

    if (this.audio.src) {

      this.audio.play().then(() => {

        this.updateState({ isPlaying: true, isLoading: false });
      }).catch(error => {
        console.error('❌ PlayerService: Error al reproducir:', error);
        this.updateState({ isLoading: false });
      });
    } else {
      console.warn('⚠️ PlayerService: No hay src de audio disponible para reproducir');
    }
  }

  // Pausar
  pause(): void {

    this.audio.pause();
    this.updateState({ isPlaying: false });
  }

  // Alternar entre reproducir y pausar
  togglePlay(): void {
    console.log('🔄 PlayerService: Toggle play solicitado', {
      isLoading: this.currentState.isLoading,
      isPlaying: this.currentState.isPlaying,
      currentSong: this.currentState.currentSong?.name,
      isChangingSong: this.isChangingSong
    });

    if (this.currentState.isLoading || this.isChangingSong) {

      return;
    }

    if (this.currentState.isPlaying) {

      this.pause();
    } else {

      this.play();
    }
  }

  // Detener la canción actual
  private stopCurrentSong(): void {
    if (!this.audio.src) {

      return;
    }


    this.audio.pause();
    this.audio.currentTime = 0;
    this.updateState({
      isPlaying: false,
      isLoading: false,
      currentTime: 0,
      bufferedTime: 0
    });

  }

  // Ir a la canción anterior
  previousTrack(): void {
    const { queue, currentIndex } = this.currentState;


    if (queue.length === 0 || this.isChangingSong) {

      return;
    }

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
    } else {

    }
  }

  // Ir a la siguiente canción
  nextTrack(): void {
    const { queue, currentIndex } = this.currentState;


    if (queue.length === 0 || this.isChangingSong) {

      return;
    }

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
    } else {
      console.warn('⚠️ PlayerService: No se puede hacer seek, duration no disponible');
    }
  }

  // Event Handlers para streaming
  private handleLoadStart(): void {

    this.updateState({ isLoading: true });
  }

  private handleCanPlay(): void {





    this.updateState({ isLoading: false });


    setTimeout(() => {
      if (!this.isChangingSong && !this.currentState.isPlaying) {
        this.play();
      }
    }, 50);
  }

  private handleWaiting(): void {

    if (!this.isChangingSong) {
      this.updateState({ isLoading: true });
    }
  }

  private handlePlaying(): void {

    this.updateState({ isLoading: false, isPlaying: true });
  }

  // Actualizar el tiempo de reproducción actual
  private updateCurrentTime(): void {
    this.updateState({
      currentTime: this.audio.currentTime
    });
  }

  // Actualizar el tiempo buffereado
  private updateBufferedTime(): void {
    if (this.audio.buffered.length > 0) {
      const bufferedEnd = this.audio.buffered.end(this.audio.buffered.length - 1);
      const previousBuffered = this.currentState.bufferedTime;
      if (Math.abs(bufferedEnd - previousBuffered) > 1) {
        console.log('📊 PlayerService: [EVENTO] progress - Buffer actualizado:', {
          bufferedTime: bufferedEnd,
          duration: this.audio.duration,
          percentage: this.audio.duration ? (bufferedEnd / this.audio.duration * 100).toFixed(1) + '%' : '0%'
        });
      }
      this.updateState({
        bufferedTime: bufferedEnd
      });
    }
  }

  // Manejar los metadatos cargados
  private handleMetadata(): void {
    console.log('📋 PlayerService: [EVENTO] loadedmetadata - Metadatos cargados:', {
      duration: this.audio.duration,
      readyState: this.audio.readyState
    });
    this.updateState({
      duration: this.audio.duration
    });
  }

  // Manejar el final de la canción
  private handleSongEnd(): void {

    this.nextTrack();
  }

  private handleError(event: Event): void {
    const mediaError = (event.target as HTMLAudioElement).error;
    this.updateState({ isLoading: false, isPlaying: false });
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

  // Obtener porcentaje de buffer
  getBufferPercentage(): number {
    if (this.currentState.duration > 0) {
      return (this.currentState.bufferedTime / this.currentState.duration) * 100;
    }
    return 0;
  }

  // Verificar si hay suficientes datos buffereados para reproducir
  canPlayThrough(): boolean {
    return this.audio.readyState >= 4; // HAVE_ENOUGH_DATA
  }

  // MÉTODOS UTILITARIOS PARA VOLUMEN

  // Obtener el icono de volumen apropiado según el nivel
  getVolumeIcon(): string {
    if (this.currentState.isMuted || this.currentState.volume === 0) {
      return '🔇'; // Silenciado
    } else if (this.currentState.volume < 30) {
      return '🔈'; // Volumen bajo
    } else if (this.currentState.volume < 70) {
      return '🔉'; // Volumen medio
    } else {
      return '🔊'; // Volumen alto
    }
  }

  // Obtener el nivel de volumen como string descriptivo
  getVolumeLevel(): string {
    if (this.currentState.isMuted || this.currentState.volume === 0) {
      return 'Silenciado';
    } else if (this.currentState.volume < 30) {
      return 'Bajo';
    } else if (this.currentState.volume < 70) {
      return 'Medio';
    } else {
      return 'Alto';
    }
  }
}
