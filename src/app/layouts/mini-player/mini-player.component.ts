import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PlayerService, PlayerState } from '../../services/player.service';
import { SongsService } from '../../services/songs.service';
import { UserService } from '../../services/user.service';
import { VoteType, VoteMessage } from '../../dtos/albumes/songs.dto';

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
  private playerSubscription?: Subscription;

  // Exponer VoteType para usar en la plantilla
  VoteType = VoteType;

  constructor(
    private playerService: PlayerService,
    private songsService: SongsService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.playerSubscription = this.playerService.playerState$.subscribe(state => {
      this.playerState = state;
      this.updateProgressPercentage();

      // Verificar si el usuario ha dado like/dislike (esto dependerá de cómo implementes esta funcionalidad)
      this.checkUserVotes();
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
      this.router.navigate(['/artist', slug]);
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
    // Esta función dependerá de cómo quieras implementarla
    // Por ejemplo, si tienes acceso al slug del álbum:
    if (this.playerState?.currentSong) {
      // Aquí tendrías que implementar la lógica para navegar al álbum
      // Por ejemplo: this.router.navigate(['/album', albumSlug]);
      console.log('Ir al álbum de la canción:', this.playerState.currentSong.name);
    }
  }

  private updateProgressPercentage(): void {
    if (this.playerState?.duration && this.playerState.duration > 0) {
      this.progressPercentage = (this.playerState.currentTime / this.playerState.duration) * 100;
    } else {
      this.progressPercentage = 0;
    }
  }

  private checkUserVotes(): void {
    // Esta lógica dependerá de cómo implementes la verificación de votos del usuario
    // Por ejemplo, podrías tener una API para consultar los votos del usuario actual
    // O podrías almacenar esta información en el estado del reproductor

    // Por ahora, lo dejamos como un stub que podrías implementar después
    this.hasLiked = false;
    this.hasDisliked = false;
  }
}
