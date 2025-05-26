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
}

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  private audio: HTMLAudioElement;
  private updateInterval: any;
  private isChangingSong = false; // Nueva bandera para controlar cambios de canción

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
    bufferedTime: 0
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
    this.audio.addEventListener('loadstart', this.handleLoadStart.bind(this));
    this.audio.addEventListener('canplay', this.handleCanPlay.bind(this));
    this.audio.addEventListener('waiting', this.handleWaiting.bind(this));
    this.audio.addEventListener('playing', this.handlePlaying.bind(this));
    this.audio.addEventListener('progress', this.updateBufferedTime.bind(this));
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

  // Reproducir una canción usando streaming
  playSong(
    song: ResponseSongDto,
    albumCover: SafeUrl | null,
    owner: UserDescription | null,
    featuredArtists: UserDescription[],
    queue: ResponseSongDto[] = [],
    currentIndex: number = 0
  ): void {
    console.log('🎵 PlayerService: Iniciando reproducción de canción:', song.name);

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
      isPlaying: false // Asegurar que empiece en pausa hasta que esté listo
    });

    // Obtener la URL de streaming directamente
    const streamUrl = this.songsService.getStreamingUrl(song.id);

    // Configurar el elemento de audio con la URL de streaming
    this.audio.src = streamUrl;
    this.audio.load();

    // Marcar que ya no estamos en proceso de cambio después de un pequeño delay
    setTimeout(() => {
      this.isChangingSong = false;
      console.log('✅ PlayerService: Cambio de canción completado');
    }, 100);
  }

  // Reproducir
  play(): void {
    console.log('▶️ PlayerService: Intentando reproducir audio...');
    if (this.audio.src) {
      console.log('🎯 PlayerService: Audio src disponible, ejecutando play()');
      this.audio.play().then(() => {
        console.log('✅ PlayerService: Audio reproduciendo exitosamente');
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
    console.log('⏸️ PlayerService: Pausando reproducción');
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
      console.log('⏳ PlayerService: No se puede hacer toggle, está cargando o cambiando canción');
      return; // No hacer nada si está cargando o cambiando canción
    }

    if (this.currentState.isPlaying) {
      console.log('⏸️ PlayerService: Pausando desde toggle');
      this.pause();
    } else {
      console.log('▶️ PlayerService: Reproduciendo desde toggle');
      this.play();
    }
  }

  // Detener la canción actual
  private stopCurrentSong(): void {
    if (!this.audio.src) {
      console.log('ℹ️ PlayerService: No hay canción actual para detener');
      return;
    }

    console.log('🛑 PlayerService: Deteniendo canción actual');
    this.audio.pause();
    this.audio.currentTime = 0;
    // No limpiar el src aquí para evitar conflictos durante el cambio
    this.updateState({
      isPlaying: false,
      isLoading: false,
      currentTime: 0,
      bufferedTime: 0
    });
    console.log('✅ PlayerService: Canción detenida y estado limpiado');
  }

  // Ir a la canción anterior
  previousTrack(): void {
    const { queue, currentIndex } = this.currentState;
    console.log('⏮️ PlayerService: Previous track solicitado', { currentIndex, queueLength: queue.length });

    if (queue.length === 0 || this.isChangingSong) {
      console.log('⚠️ PlayerService: No se puede cambiar - sin cola o ya cambiando');
      return;
    }

    // Si estamos en los primeros 3 segundos de la canción, ir a la anterior
    // Si no, reiniciar la canción actual
    if (this.audio.currentTime > 3) {
      console.log('🔄 PlayerService: Reiniciando canción actual (más de 3 segundos)');
      this.audio.currentTime = 0;
    } else if (currentIndex > 0) {
      const previousIndex = currentIndex - 1;
      const previousSong = queue[previousIndex];
      console.log('⏮️ PlayerService: Yendo a canción anterior:', { previousIndex, title: previousSong.name });
      this.playSong(
        previousSong,
        this.currentState.albumCover,
        this.currentState.owner,
        this.currentState.featuredArtists,
        queue,
        previousIndex
      );
    } else {
      console.log('⚠️ PlayerService: Ya estamos en la primera canción');
    }
  }

  // Ir a la siguiente canción
  nextTrack(): void {
    const { queue, currentIndex } = this.currentState;
    console.log('⏭️ PlayerService: Next track solicitado', { currentIndex, queueLength: queue.length });

    if (queue.length === 0 || this.isChangingSong) {
      console.log('⚠️ PlayerService: No se puede cambiar - sin cola o ya cambiando');
      return;
    }

    // Si hay una canción siguiente, reproducirla
    // Si estamos en la última canción, volver a la primera (comportamiento circular)
    if (currentIndex < queue.length - 1) {
      const nextIndex = currentIndex + 1;
      const nextSong = queue[nextIndex];
      console.log('⏭️ PlayerService: Yendo a siguiente canción:', { nextIndex, title: nextSong.name });
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
      console.log('🔄 PlayerService: Volviendo a la primera canción (comportamiento circular)');
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
    console.log('🎯 PlayerService: Seek solicitado al', percentage + '%');
    if (this.audio.duration) {
      const seekTime = (percentage / 100) * this.audio.duration;
      console.log('⏱️ PlayerService: Saltando a tiempo:', seekTime, 'segundos');
      this.audio.currentTime = seekTime;
    } else {
      console.warn('⚠️ PlayerService: No se puede hacer seek, duration no disponible');
    }
  }

  // Event Handlers para streaming
  private handleLoadStart(): void {
    console.log('🔄 PlayerService: [EVENTO] loadstart - Iniciando carga de audio');
    this.updateState({ isLoading: true });
  }

  private handleCanPlay(): void {
    console.log('✅ PlayerService: [EVENTO] canplay - Audio listo para reproducir');
    console.log('📊 PlayerService: Audio readyState:', this.audio.readyState);
    console.log('📊 PlayerService: Audio duration:', this.audio.duration);
    console.log('🔍 PlayerService: Estado actual - isChangingSong:', this.isChangingSong, 'isPlaying:', this.currentState.isPlaying);

    this.updateState({ isLoading: false });

    // Solo auto-reproducir si no estamos en proceso de cambio de canción
    // y si hay una canción actual y no está reproduciéndose
    console.log('🚀 PlayerService: Auto-reproduciendo tras canplay');
    // Pequeño delay para asegurar que todo esté estable
    setTimeout(() => {
      if (!this.isChangingSong && !this.currentState.isPlaying) {
        this.play();
      }
    }, 50);
  }

  private handleWaiting(): void {
    console.log('⏳ PlayerService: [EVENTO] waiting - Esperando más datos...');
    // Solo mostrar loading si no estamos cambiando canción
    if (!this.isChangingSong) {
      this.updateState({ isLoading: true });
    }
  }

  private handlePlaying(): void {
    console.log('🎵 PlayerService: [EVENTO] playing - Audio reproduciéndose');
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
      if (Math.abs(bufferedEnd - previousBuffered) > 1) { // Solo log si cambió significativamente
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
    console.log('🏁 PlayerService: [EVENTO] ended - Canción terminada, yendo a siguiente');
    // Al finalizar la canción, ir a la siguiente (con comportamiento circular)
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
}
