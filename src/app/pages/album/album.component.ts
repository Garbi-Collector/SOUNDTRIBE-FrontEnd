import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlbumService } from '../../services/album.service';
import { SongsService } from '../../services/songs.service';
import { UserService } from '../../services/user.service';
import { NumbersService } from '../../services/numbers.service';
import { ResponseAlbumDto, ResponseSongDto } from '../../dtos/albumes/musics.response.dto';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import {forkJoin, Observable, of, tap} from 'rxjs';
import { catchError, switchMap, map } from 'rxjs/operators';
import { VoteType, VoteMessage } from '../../dtos/albumes/songs.dto';
import { AuthService } from '../../services/auth.service';
import { ModalService, ModalType } from '../../services/modal.service';
import { UserGet, UserDescription } from '../../dtos/usuarios/users.dto';
import { PlayerService } from '../../services/player.service';

@Component({
  selector: 'app-album',
  templateUrl: './album.component.html',
  styleUrls: ['./album.component.css']
})
export class AlbumComponent implements OnInit {
  // Propiedades principales
  album: ResponseAlbumDto | null = null;
  albumSlug: string | null = null;
  isLoading = true;
  error: string | null = null;
  isAuthenticated = false;
  // Propiedades para las imágenes y datos adicionales
  albumCover: SafeUrl | null = null;
  owner: UserDescription | null = null;
  featuredArtists: UserDescription[] = [];
  // Estado para los votos de las canciones
  songVotes: Map<number, VoteType | null> = new Map();
  songVotesLoading: Map<number, boolean> = new Map();
  // Estado para el like del álbum
  likeCount: number | null = null;
  albumLiked: boolean = false;
  albumLikeLoading: boolean = false;
  // Control de reproducción
  currentPlayingSongId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private albumService: AlbumService,
    protected songsService: SongsService,
    private userService: UserService,
    private authService: AuthService,
    private modalService: ModalService,
    public numbersService: NumbersService,
    private sanitizer: DomSanitizer,
    private playerService: PlayerService
  ) {}

  ngOnInit(): void {
    this.authService.isAuthenticated$.subscribe(isAuth => {
      this.isAuthenticated = isAuth;
    });

    // Obtener el slug del álbum de la URL
    this.route.paramMap.subscribe(params => {
      this.albumSlug = params.get('albumSlug');
      if (this.albumSlug) {
        this.loadAlbumBySlug(this.albumSlug);
      } else {
        this.error = 'Álbum no encontrado';
        this.isLoading = false;
      }
    });
    this.checkIfAlbumIsLiked();

    // Suscribirse al estado del player para conocer la canción actual
    this.playerService.playerState$.subscribe(state => {
      this.currentPlayingSongId = state.currentSong?.id || null;
    });
  }

  // Cargar album por slug
  loadAlbumBySlug(slug: string): void {

    console.time('loadAlbumBySlug');
    this.isLoading = true;
    this.error = null;

    console.time('getAlbumBySlug');
    this.albumService.getAlbumBySlug(slug).pipe(
      tap(() => {
        console.timeEnd('getAlbumBySlug');

      }),
      switchMap(album => {

        this.album = album;
        // Cargar portada del álbum

        console.time('obtenerPortada');
        const coverObservable = this.songsService.obtenerPortadaPorId(album.id).pipe(
          tap(() => {
            console.timeEnd('obtenerPortada');

          }),
          map(blob => {

            const objectUrl = URL.createObjectURL(blob);
            return this.sanitizer.bypassSecurityTrustUrl(objectUrl);
          }),
          catchError(error => {
            console.error('[loadAlbumBySlug] Error cargando la portada:', error);
            return of(null);
          })
        );
        // Cargar información del propietario

        console.time('getUserDescription');
        const ownerObservable = this.userService.getUserDescription(album.owner).pipe(
          tap(owner => {
            console.timeEnd('getUserDescription');

          }),
          catchError(error => {
            console.error('[loadAlbumBySlug] Error cargando datos del artista:', error);
            return of(null);
          })
        );
        // Cargar artistas invitados en las canciones

        const uniqueFeaturedArtistIds = new Set<number>();
        album.songs.forEach(song => {
          if (song.artistasFt && song.artistasFt.length > 0) {

            song.artistasFt.forEach(artistId => uniqueFeaturedArtistIds.add(artistId));
          }
        });

        console.time('getFeaturedArtists');
        const featuredArtistsObservables: Observable<UserDescription | null>[] = [];
        uniqueFeaturedArtistIds.forEach(artistId => {

          featuredArtistsObservables.push(
            this.userService.getUserDescription(artistId).pipe(
              tap(artist => {

              }),
              catchError(error => {
                console.error(`[loadAlbumBySlug] Error cargando artista con ID ${artistId}:`, error);
                return of(null);
              })
            )
          );
        });
        // Inicializar mapas de votos

        album.songs.forEach(song => {
          this.songVotes.set(song.id, null);
          this.songVotesLoading.set(song.id, false);
        });

        let userVotesObservable = of(null);
        let albumLikedObservable = of(false);
        let likesCountObservable = of(0); // NUEVO observable para el conteo


        // Si el usuario está autenticado, cargar los votos actuales y el estado de like del álbum
        if (this.isAuthenticated) {

          console.time('loadUserVotes');
          userVotesObservable = this.loadUserVotes(album.songs);

          // Verificar si el usuario ha dado like al álbum
          console.time('checkAlbumLiked');
          albumLikedObservable = this.albumService.isAlbumLiked(album.id).pipe(
            tap(isLiked => {
              console.timeEnd('checkAlbumLiked');

              this.albumLiked = isLiked;
            }),
            catchError(error => {
              console.error('[loadAlbumBySlug] Error verificando like del álbum:', error);
              return of(false);
            })
          );
        } else {

        }

        // NUEVO: Cargar el conteo de likes siempre (autenticado o no)
        likesCountObservable = this.albumService.getLikesCount(album.id).pipe(
          tap(count => {

            // Actualizar directamente el álbum
            this.album!.likeCount = count;
          }),
          catchError(error => {
            console.error('[loadAlbumBySlug] Error obteniendo conteo de likes:', error);
            return of(0);
          })
        );

        // Crea un observable para los artistas invitados que siempre emite (incluso con array vacío)
        const featuredArtistsObservable = featuredArtistsObservables.length > 0
          ? forkJoin(featuredArtistsObservables).pipe(

            tap(() => {
              console.timeEnd('getFeaturedArtists');

            })
          )
          : of([]).pipe(

            tap(() => {
              console.timeEnd('getFeaturedArtists');

            })
          );


        return forkJoin({
          cover: coverObservable.pipe(

          ),
          owner: ownerObservable.pipe(

          ),
          featuredArtists: featuredArtistsObservable,
          userVotes: userVotesObservable,
          albumLiked: albumLikedObservable,
          likesCount: likesCountObservable
        });
      })
    ).subscribe({
      next: (results) => {

        this.albumCover = results.cover;

        this.owner = results.owner;

        // Filtrar artistas nulos del resultado
        this.featuredArtists = results.featuredArtists.filter(artist => artist !== null) as UserDescription[];


        if (this.isAuthenticated) {
          console.timeEnd('loadUserVotes');
        }
        this.isLoading = false;
        console.timeEnd('loadAlbumBySlug');

      },
      error: (err) => {
        console.error('[loadAlbumBySlug] Error cargando el álbum:', err);
        this.error = 'No se pudo cargar el álbum. Por favor, intenta nuevamente.';
        this.isLoading = false;
        console.timeEnd('loadAlbumBySlug');

      }
    });
  }

  // Cargar los votos actuales del usuario para cada canción
  loadUserVotes(songs: ResponseSongDto[]): Observable<any> {


    // Crear observables para verificar cada tipo de voto para cada canción
    const songVoteObservables: Observable<any>[] = [];

    songs.forEach(song => {
      // Verificar LIKE
      songVoteObservables.push(
        this.songsService.isVoted(song.id, VoteType.LIKE).pipe(
          tap(isLiked => {
            if (isLiked) {

              this.songVotes.set(song.id, VoteType.LIKE);
            }
          }),
          catchError(error => {
            console.error(`[loadUserVotes] Error verificando LIKE para canción ${song.id}:`, error);
            return of(null);
          })
        )
      );

      // Verificar DISLIKE
      songVoteObservables.push(
        this.songsService.isVoted(song.id, VoteType.DISLIKE).pipe(
          tap(isDisliked => {
            if (isDisliked) {

              this.songVotes.set(song.id, VoteType.DISLIKE);
            }
          }),
          catchError(error => {
            console.error(`[loadUserVotes] Error verificando DISLIKE para canción ${song.id}:`, error);
            return of(null);
          })
        )
      );
    });

    return songVoteObservables.length > 0
      ? forkJoin(songVoteObservables).pipe(

      )
      : of(null);
  }

  // Navegar al perfil del artista
  goToArtistProfile(slugOrId: string | number): void {
    if (typeof slugOrId === 'string') {
      this.router.navigate(['/perfil', slugOrId]);
    } else if (typeof slugOrId === 'number') {
      // Si solo tenemos el ID, primero debemos obtener el slug
      this.userService.getUserDescription(slugOrId).subscribe({
        next: (user) => {
          if (user && user.slug) {
            this.router.navigate(['/perfil', user.slug]);
          }
        },
        error: (err) => {
          console.error('Error obteniendo perfil:', err);
        }
      });
    }
  }

  // Reproducir una canción usando el PlayerService
  playSong(song: ResponseSongDto): void {
    if (!this.album || !this.albumCover) return;

    // Preparar la cola de reproducción (todas las canciones del álbum)
    const queue = [...this.album.songs];
    const currentIndex = queue.findIndex(s => s.id === song.id);

    // Reproducir la canción usando el PlayerService
    this.playerService.playSong(
      song,
      this.albumCover,
      this.owner,
      this.featuredArtists,
      queue,
      currentIndex
    );
  }

  // Función para formatear la duración de la canción
  formatDuration(durationInSeconds: number): string {
    const minutes = Math.floor(durationInSeconds / 60);
    const seconds = Math.floor(durationInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  // Funciones para los votos
  vote(song: ResponseSongDto, voteType: VoteType): void {
    if (!this.isAuthenticated) {
      this.modalService.openModal(ModalType.Auth);
      return;
    }
    const currentVote = this.songVotes.get(song.id);
    this.songVotesLoading.set(song.id, true);
    const voteMessage: VoteMessage = {
      songId: song.id,
      voteType: voteType
    };
    this.songsService.votar(voteMessage).subscribe({
      next: () => {
        // If clicking the same vote type, remove the vote
        if (currentVote === voteType) {
          this.songVotes.set(song.id, null);
          // Update counters - decrease the count for the removed vote
          if (voteType === VoteType.LIKE) {
            song.likes = Math.max(0, (song.likes || 1) - 1);
          } else {
            song.dislikes = Math.max(0, (song.dislikes || 1) - 1);
          }
        } else {
          // New vote or changing vote type
          this.songVotes.set(song.id, voteType);
          // Update counters
          if (voteType === VoteType.LIKE) {
            song.likes = (song.likes || 0) + 1;
            if (currentVote === VoteType.DISLIKE) {
              song.dislikes = Math.max(0, (song.dislikes || 1) - 1);
            }
          } else {
            song.dislikes = (song.dislikes || 0) + 1;
            if (currentVote === VoteType.LIKE) {
              song.likes = Math.max(0, (song.likes || 1) - 1);
            }
          }
        }
        this.songVotesLoading.set(song.id, false);
      },
      error: (err) => {
        console.error('Error al votar:', err);
        this.songVotesLoading.set(song.id, false);
      }
    });
  }

  // Comprobar si el usuario ha votado por una canción
  hasVoted(song: ResponseSongDto, voteType: VoteType): boolean {
    return this.songVotes.get(song.id) === voteType;
  }

  // Dar "like" al álbum completo
  likeAlbum(): void {
    if (!this.album) {
      console.error('No se ha cargado el álbum aún.');
      return;
    }

    if (!this.isAuthenticated) {
      this.modalService.openModal(ModalType.Auth);
      return;
    }

    this.albumLikeLoading = true;

    this.albumService.likeOrUnlikeAlbum(this.album.id).subscribe({
      next: (message) => {

        // Invertir el estado de like del álbum
        this.albumLiked = !this.albumLiked;

        // Actualizar el contador de likes del álbum
        if (this.albumLiked) {
          this.album!.likeCount = (this.album!.likeCount || 0) + 1;
        } else {
          this.album!.likeCount = Math.max(0, (this.album!.likeCount || 1) - 1);
        }

        this.albumLikeLoading = false;
      },
      error: (err) => {
        console.error('Error al dar like al álbum:', err);
        this.albumLikeLoading = false;
      }
    });


  }

  // Verificar si el usuario ha dado like al álbum
  hasLikedAlbum(): boolean {
    return this.albumLiked;
  }


  checkIfAlbumIsLiked(): void {
    if (this.album) {
      this.albumService.isAlbumLiked(this.album.id).subscribe({
        next: (liked: boolean) => {
          this.albumLiked = liked;
        },
        error: (error) => {
          console.error('Error al verificar si el álbum fue likeado:', error);
          this.albumLiked = false; // por si falla la petición
        }
      });
    }
  }


  checkAlbumLikesCount(): void {
    if (this.album) {
      this.albumService.getLikesCount(this.album.id).subscribe({
        next: (count: number) => {
          this.likeCount = count;
        },
        error: (error) => {
          console.error('Error al obtener la cantidad de likes del álbum:', error);
        }
      });
    }
  }


  // Verificar si una canción está reproduciéndose actualmente
  isPlaying(songId: number): boolean {
    return this.currentPlayingSongId === songId && this.playerService.currentState.isPlaying;
  }

  protected readonly VoteType = VoteType;
}
