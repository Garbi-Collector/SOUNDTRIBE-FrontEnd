import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';
import { PlayerService, PlayerState } from '../../services/player.service';
import { SongsService } from '../../services/songs.service';
import { UserService } from '../../services/user.service';
import { VoteType, VoteMessage } from '../../dtos/albumes/songs.dto';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ResponseSongDto } from '../../dtos/albumes/musics.response.dto';
import { UserDescription } from '../../dtos/usuarios/users.dto';

@Component({
  selector: 'app-mini-player',
  templateUrl: './mini-player.component.html',
  styleUrls: ['./mini-player.component.css']
})
export class MiniPlayerComponent implements OnInit, OnDestroy {
  playerState: PlayerState | null = null;
  isExpanded = false;
  loading = false;
  voteLoading = false;
  hasLiked = false;
  hasDisliked = false;
  progressPercentage = 0;
  albumCoverUrl: SafeUrl | null = null;

  private playerSubscription?: Subscription;

  // Exponer VoteType para usar en la plantilla
  VoteType = VoteType;

  constructor(
    private playerService: PlayerService,
    private songsService: SongsService,
    private userService: UserService,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.playerSubscription = this.playerService.playerState$.subscribe(state => {
      this.playerState = state;
      this.updateProgressPercentage();

      // Procesar la portada del álbum si existe
      if (state?.albumCover) {
        this.albumCoverUrl = this.sanitizer.bypassSecurityTrustUrl(state.albumCover.toString());
      } else {
        this.albumCoverUrl = null;
      }

      // Verificar si el usuario ha dado like/dislike cuando cambia la canción
      if (state?.currentSong) {
        this.checkUserVotes(state.currentSong.id);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.playerSubscription) {
      this.playerSubscription.unsubscribe();
    }
  }

  toggleExpand(): void {
    this.isExpanded = !this.isExpanded;
  }

  togglePlay(): void {
    if (this.loading) return;
    this.playerService.togglePlay();
  }

  previousTrack(): void {
    if (this.loading) return;
    this.loading = true;
    this.playerService.previousTrack();
    setTimeout(() => { this.loading = false; }, 500); // Pequeño delay para evitar múltiples clics rápidos
  }

  nextTrack(): void {
    if (this.loading) return;
    this.loading = true;
    this.playerService.nextTrack();
    setTimeout(() => { this.loading = false; }, 500); // Pequeño delay para evitar múltiples clics rápidos
  }

  seekTo(event: MouseEvent): void {
    const element = event.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const percentage = (offsetX / rect.width) * 100;
    this.playerService.seek(percentage);
  }

  formatTime(seconds: number | undefined): string {
    if (seconds === undefined) return '0:00';
    return this.playerService.formatTime(seconds);
  }

  vote(voteType: VoteType): void {
    if (this.voteLoading || !this.playerState?.currentSong) return;
    this.voteLoading = true;
    // Si ya ha votado con el mismo tipo, eliminar el voto
    if ((voteType === VoteType.LIKE && this.hasLiked) ||
      (voteType === VoteType.DISLIKE && this.hasDisliked)) {
      this.songsService.eliminarVoto(this.playerState.currentSong.id).subscribe({
        next: () => {
          if (voteType === VoteType.LIKE) {
            this.hasLiked = false;
          } else {
            this.hasDisliked = false;
          }
          this.voteLoading = false;
        },
        error: (err) => {
          console.error('Error al eliminar voto:', err);
          this.voteLoading = false;
        }
      });
    } else {
      // Enviar nuevo voto
      const voteMessage: VoteMessage = {
        songId: this.playerState.currentSong.id,
        voteType: voteType
      };
      this.songsService.votar(voteMessage).subscribe({
        next: () => {
          // Actualizar los estados de los votos
          if (voteType === VoteType.LIKE) {
            this.hasLiked = true;
            this.hasDisliked = false;
          } else {
            this.hasDisliked = true;
            this.hasLiked = false;
          }
          this.voteLoading = false;
        },
        error: (err) => {
          console.error('Error al votar:', err);
          this.voteLoading = false;
        }
      });
    }
  }

  goToArtistProfile(slug: string | undefined): void {
    if (slug) {
      this.router.navigate(['/perfil', slug]);
    }
  }

  goToArtistProfileById(id: number): void {
    this.userService.getUserDescription(id).subscribe({
      next: (artist) => {
        if (artist.slug) {
          this.goToArtistProfile(artist.slug);
        }
      },
      error: (err) => {
        console.error('Error al obtener la descripción del usuario:', err);
      }
    });
  }

  goToAlbum(): void {
    if (this.playerState?.currentSong?.slug) {
      // Buscar el slug del álbum si está disponible en el estado del player
      if (this.playerState.currentSong.slug) {
        this.router.navigate(['/album', this.playerState.currentSong.slug]);
      } else {
        // Si no tenemos el slug, navegar usando el ID
        this.router.navigate(['/album', this.playerState.currentSong.id]);
      }
    }
  }

  // Método para reproducir una canción específica de la queue
  playSongFromQueue(index: number): void {
    if (this.loading || !this.playerState?.queue || index === this.playerState.currentIndex) return;

    this.loading = true;
    const song = this.playerState.queue[index];

    // Reproducir la canción seleccionada usando el PlayerService
    this.playerService.playSong(
      song,
      this.playerState.albumCover,
      this.playerState.owner,
      this.playerState.featuredArtists,
      this.playerState.queue,
      index
    );

    setTimeout(() => { this.loading = false; }, 500); // Pequeño delay para evitar múltiples clics rápidos
  }

  // Obtener la portada del álbum para una canción en la queue
  getAlbumCoverForSong(song: ResponseSongDto): SafeUrl | null {
    // En este caso simple retornamos la portada actual,
    // ya que no tenemos información de portada por cada canción individual
    return this.albumCoverUrl;
  }

  // Obtener la información del artista para una canción en la queue
  getArtistForSong(song: ResponseSongDto): UserDescription | null | undefined {
    // Si el owner es el mismo para todas las canciones, retornamos el owner actual
    return this.playerState?.owner;
  }

  private updateProgressPercentage(): void {
    if (this.playerState?.duration && this.playerState.duration > 0) {
      this.progressPercentage = (this.playerState.currentTime / this.playerState.duration) * 100;
    } else {
      this.progressPercentage = 0;
    }
  }

  private checkUserVotes(songId: number): void {
    this.voteLoading = true;
    // Usar forkJoin para hacer las dos solicitudes en paralelo
    forkJoin([
      this.songsService.isVoted(songId, VoteType.LIKE),
      this.songsService.isVoted(songId, VoteType.DISLIKE)
    ]).subscribe({
      next: ([likeResult, dislikeResult]) => {
        this.hasLiked = likeResult;
        this.hasDisliked = dislikeResult;
        this.voteLoading = false;
      },
      error: (err) => {
        console.error('Error al verificar los votos:', err);
        this.hasLiked = false;
        this.hasDisliked = false;
        this.voteLoading = false;
      }
    });
  }
}
