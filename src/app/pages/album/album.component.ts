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
    console.log(`[loadAlbumBySlug] Iniciando carga del álbum con slug: ${slug}`);
    console.time('loadAlbumBySlug');
    this.isLoading = true;
    this.error = null;
    console.log('[loadAlbumBySlug] Solicitando álbum al servicio...');
    console.time('getAlbumBySlug');
    this.albumService.getAlbumBySlug(slug).pipe(
      tap(() => {
        console.timeEnd('getAlbumBySlug');
        console.log('[loadAlbumBySlug] Álbum obtenido del servicio');
      }),
      switchMap(album => {
        console.log('[loadAlbumBySlug] Procesando álbum:', album.name, 'ID:', album.id);
        this.album = album;
        // Cargar portada del álbum
        console.log('[loadAlbumBySlug] Solicitando portada del álbum...');
        console.time('obtenerPortada');
        const coverObservable = this.songsService.obtenerPortadaPorId(album.id).pipe(
          tap(() => {
            console.timeEnd('obtenerPortada');
            console.log('[loadAlbumBySlug] Portada recibida');
          }),
          map(blob => {
            console.log('[loadAlbumBySlug] Creando URL para la portada', { blobSize: blob.size });
            const objectUrl = URL.createObjectURL(blob);
            return this.sanitizer.bypassSecurityTrustUrl(objectUrl);
          }),
          catchError(error => {
            console.error('[loadAlbumBySlug] Error cargando la portada:', error);
            return of(null);
          })
        );
        // Cargar información del propietario
        console.log('[loadAlbumBySlug] Solicitando datos del propietario ID:', album.owner);
        console.time('getUserDescription');
        const ownerObservable = this.userService.getUserDescription(album.owner).pipe(
          tap(owner => {
            console.timeEnd('getUserDescription');
            console.log('[loadAlbumBySlug] Datos del propietario recibidos:', owner?.username);
          }),
          catchError(error => {
            console.error('[loadAlbumBySlug] Error cargando datos del artista:', error);
            return of(null);
          })
        );
        // Cargar artistas invitados en las canciones
        console.log('[loadAlbumBySlug] Procesando artistas invitados...');
        const uniqueFeaturedArtistIds = new Set<number>();
        album.songs.forEach(song => {
          if (song.artistasFt && song.artistasFt.length > 0) {
            console.log(`[loadAlbumBySlug] Canción "${song.name}" tiene ${song.artistasFt.length} artistas invitados`);
            song.artistasFt.forEach(artistId => uniqueFeaturedArtistIds.add(artistId));
          }
        });
        console.log(`[loadAlbumBySlug] Total de artistas invitados únicos: ${uniqueFeaturedArtistIds.size}`);
        console.time('getFeaturedArtists');
        const featuredArtistsObservables: Observable<UserDescription | null>[] = [];
        uniqueFeaturedArtistIds.forEach(artistId => {
          console.log(`[loadAlbumBySlug] Solicitando datos del artista invitado ID: ${artistId}`);
          featuredArtistsObservables.push(
            this.userService.getUserDescription(artistId).pipe(
              tap(artist => {
                console.log(`[loadAlbumBySlug] Datos del artista ${artistId} recibidos:`, artist?.username);
              }),
              catchError(error => {
                console.error(`[loadAlbumBySlug] Error cargando artista con ID ${artistId}:`, error);
                return of(null);
              })
            )
          );
        });
        // Inicializar mapas de votos
        console.log('[loadAlbumBySlug] Inicializando mapas de votos para', album.songs.length, 'canciones');
        album.songs.forEach(song => {
          this.songVotes.set(song.id, null);
          this.songVotesLoading.set(song.id, false);
        });

        let userVotesObservable = of(null);
        let albumLikedObservable = of(false);
        let likesCountObservable = of(0); // NUEVO observable para el conteo


        // Si el usuario está autenticado, cargar los votos actuales y el estado de like del álbum
        if (this.isAuthenticated) {
          console.log('[loadAlbumBySlug] Usuario autenticado, cargando votos y estado del álbum...');
          console.time('loadUserVotes');
          userVotesObservable = this.loadUserVotes(album.songs);

          // Verificar si el usuario ha dado like al álbum
          console.time('checkAlbumLiked');
          albumLikedObservable = this.albumService.isAlbumLiked(album.id).pipe(
            tap(isLiked => {
              console.timeEnd('checkAlbumLiked');
              console.log('[loadAlbumBySlug] Estado de like del álbum:', isLiked);
              this.albumLiked = isLiked;
            }),
            catchError(error => {
              console.error('[loadAlbumBySlug] Error verificando like del álbum:', error);
              return of(false);
            })
          );
        } else {
          console.log('[loadAlbumBySlug] Usuario no autenticado, omitiendo carga de votos y estado de like');
        }

        // NUEVO: Cargar el conteo de likes siempre (autenticado o no)
        likesCountObservable = this.albumService.getLikesCount(album.id).pipe(
          tap(count => {
            console.log('[loadAlbumBySlug] Conteo de likes:', count);
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
            tap(() => console.log('[forkJoin] featuredArtists completado')),
            tap(() => {
              console.timeEnd('getFeaturedArtists');
              console.log('[loadAlbumBySlug] Todos los artistas invitados recibidos');
            })
          )
          : of([]).pipe(
            tap(() => console.log('[forkJoin] No hay artistas invitados que cargar')),
            tap(() => {
              console.timeEnd('getFeaturedArtists');
              console.log('[loadAlbumBySlug] No hay artistas invitados que procesar');
            })
          );

        console.log('[loadAlbumBySlug] Ejecutando forkJoin para todas las solicitudes paralelas');
        return forkJoin({
          cover: coverObservable.pipe(
            tap(() => console.log('[forkJoin] coverObservable completado'))
          ),
          owner: ownerObservable.pipe(
            tap(() => console.log('[forkJoin] ownerObservable completado'))
          ),
          featuredArtists: featuredArtistsObservable,
          userVotes: userVotesObservable,
          albumLiked: albumLikedObservable,
          likesCount: likesCountObservable
        });
      })
    ).subscribe({
      next: (results) => {
        console.log('[loadAlbumBySlug] Todas las solicitudes completadas correctamente');
        this.albumCover = results.cover;
        console.log('[loadAlbumBySlug] Portada asignada:', results.cover ? 'Disponible' : 'No disponible');
        this.owner = results.owner;
        console.log('[loadAlbumBySlug] Propietario asignado:', this.owner?.username);
        // Filtrar artistas nulos del resultado
        this.featuredArtists = results.featuredArtists.filter(artist => artist !== null) as UserDescription[];
        console.log('[loadAlbumBySlug] LikeCount final:', this.album?.likeCount);
        console.log('[loadAlbumBySlug] Artistas invitados procesados:', this.featuredArtists.length);
        if (this.isAuthenticated) {
          console.timeEnd('loadUserVotes');
        }
        this.isLoading = false;
        console.timeEnd('loadAlbumBySlug');
        console.log('[loadAlbumBySlug] Proceso completado');
      },
      error: (err) => {
        console.error('[loadAlbumBySlug] Error cargando el álbum:', err);
        this.error = 'No se pudo cargar el álbum. Por favor, intenta nuevamente.';
        this.isLoading = false;
        console.timeEnd('loadAlbumBySlug');
        console.log('[loadAlbumBySlug] Proceso terminado con error');
      }
    });
  }

  // Cargar los votos actuales del usuario para cada canción
  loadUserVotes(songs: ResponseSongDto[]): Observable<any> {
    console.log('[loadUserVotes] Cargando votos para', songs.length, 'canciones');

    // Crear observables para verificar cada tipo de voto para cada canción
    const songVoteObservables: Observable<any>[] = [];

    songs.forEach(song => {
      // Verificar LIKE
      songVoteObservables.push(
        this.songsService.isVoted(song.id, VoteType.LIKE).pipe(
          tap(isLiked => {
            if (isLiked) {
              console.log(`[loadUserVotes] Canción ${song.id} tiene LIKE del usuario`);
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
              console.log(`[loadUserVotes] Canción ${song.id} tiene DISLIKE del usuario`);
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
        tap(() => console.log('[loadUserVotes] Todos los votos cargados'))
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
        console.log('Respuesta del backend:', message);
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

    console.log('Toggle like álbum:', this.album.name);
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
