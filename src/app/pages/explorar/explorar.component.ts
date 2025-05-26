import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, catchError, map, finalize } from 'rxjs/operators';
import {
  ResponseGeneroDto,
  ResponseAlbumDto,
  ResponseSongPortadaDto
} from "../../dtos/albumes/musics.response.dto";
import { CategoriaService } from "../../services/categoria.service";
import { ExploreService } from "../../services/explore.service";
import { SongsService } from "../../services/songs.service";
import { PlayerService } from "../../services/player.service";
import { UserService } from "../../services/user.service";
import { UserDescription, UserGet } from "../../dtos/usuarios/users.dto";

interface FilterType {
  key: 'albums' | 'songs' | 'artists' | 'listeners';
  label: string;
  active: boolean;
}

@Component({
  selector: 'app-explorar',
  templateUrl: './explorar.component.html',
  styleUrls: ['./explorar.component.css']
})
export class ExplorarComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Buscador
  searchTerm = '';

  // Filtros de tipo de búsqueda
  filters: FilterType[] = [
    { key: 'albums', label: 'Álbumes', active: true },
    { key: 'songs', label: 'Canciones', active: true },
    { key: 'artists', label: 'Artistas', active: true },
    { key: 'listeners', label: 'Oyentes', active: true }
  ];

  // Filtro de género
  genres: ResponseGeneroDto[] = [];
  selectedGenre: number | null = null;
  loadingGenres = false;

  // Álbumes
  albums: ResponseAlbumDto[] = [];
  albumCovers: Map<number, SafeUrl> = new Map();
  loadingAlbums = false;
  albumsError: string | null = null;

  // Canciones
  songs: ResponseSongPortadaDto[] = [];
  songCovers: Map<number, SafeUrl> = new Map();
  loadingSongs = false;
  songsError: string | null = null;

  // Usuarios (Artistas y Oyentes)
  allUsers: UserGet[] = [];
  artists: UserGet[] = [];
  listeners: UserGet[] = [];
  loadingUsers = false;
  usersError: string | null = null;

  // Estado de búsqueda
  hasSearched = false;
  isInitialLoad = true;

  constructor(
    private categoriaService: CategoriaService,
    private exploreService: ExploreService,
    private songsService: SongsService,
    private userService: UserService,
    private sanitizer: DomSanitizer,
    private router: Router,
    private playerService: PlayerService
  ) {}

  ngOnInit() {
    this.loadGenres();
    this.loadInitialContent();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadGenres() {
    this.loadingGenres = true;
    this.categoriaService.getAllGeneros()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (genres) => {
          this.genres = genres;
          this.loadingGenres = false;
          console.log('[loadGenres] Géneros cargados:', this.genres);
        },
        error: (error) => {
          console.error('[loadGenres] Error loading genres:', error);
          this.loadingGenres = false;
        }
      });
  }

  /**
   * Carga contenido inicial (álbumes, canciones y usuarios populares)
   */
  private loadInitialContent() {
    console.log('[loadInitialContent] Cargando contenido inicial');
    this.loadInitialAlbums();
    this.loadInitialSongs();
    this.loadInitialUsers();
  }

  /**
   * Carga usuarios iniciales (todos los usuarios del sistema)
   */
  private loadInitialUsers() {
    console.log('[loadInitialUsers] Cargando usuarios iniciales');
    this.loadingUsers = true;
    this.usersError = null;

    this.userService.getAllUsersWithJwt()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log(`[loadInitialUsers] ${response.usuarios.length} usuarios recibidos`);
          this.allUsers = response.usuarios;
          this.filterUsersByRole();
          this.loadingUsers = false;
        },
        error: (error) => {
          console.error('[loadInitialUsers] Error al cargar usuarios iniciales:', error);
          this.usersError = 'No se pudieron cargar los usuarios. Por favor, intenta nuevamente.';
          this.loadingUsers = false;
        }
      });
  }

  /**
   * Filtra usuarios por rol (Artista/Oyente) y aplica límite de 11 por categoría
   */
  private filterUsersByRole() {
    // Separar usuarios por rol
    const allArtists = this.allUsers.filter(user =>
      user.rol.toLowerCase() === 'artista' || user.rol.toLowerCase() === 'artist'
    );
    const allListeners = this.allUsers.filter(user =>
      user.rol.toLowerCase() === 'oyente' || user.rol.toLowerCase() === 'listener'
    );

    // Aplicar límite de 11 usuarios por categoría
    this.artists = allArtists.slice(0, 11);
    this.listeners = allListeners.slice(0, 11);

    console.log(`[filterUsersByRole] Artistas: ${this.artists.length}, Oyentes: ${this.listeners.length}`);
  }

  /**
   * Busca usuarios según el término de búsqueda
   */
  private searchUsers() {
    console.log('[searchUsers] Iniciando búsqueda de usuarios');

    if (!this.searchTerm.trim()) {
      // Si no hay término de búsqueda, mostrar todos los usuarios
      this.filterUsersByRole();
      return;
    }

    const searchTermLower = this.searchTerm.toLowerCase();

    // Filtrar usuarios que coincidan con el término de búsqueda
    const filteredUsers = this.allUsers.filter(user =>
      user.username.toLowerCase().includes(searchTermLower)
    );

    // Separar por rol y aplicar límite
    const filteredArtists = filteredUsers.filter(user =>
      user.rol.toLowerCase() === 'artista' || user.rol.toLowerCase() === 'artist'
    );
    const filteredListeners = filteredUsers.filter(user =>
      user.rol.toLowerCase() === 'oyente' || user.rol.toLowerCase() === 'listener'
    );

    this.artists = filteredArtists.slice(0, 11);
    this.listeners = filteredListeners.slice(0, 11);

    console.log(`[searchUsers] Resultados - Artistas: ${this.artists.length}, Oyentes: ${this.listeners.length}`);
  }

  /**
   * Carga álbumes iniciales (populares)
   */
  private loadInitialAlbums() {
    console.log('[loadInitialAlbums] Cargando álbumes iniciales');
    this.loadingAlbums = true;
    this.albumsError = null;

    this.exploreService.obtenerAlbunesPopulares()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (albums) => {
          console.log(`[loadInitialAlbums] ${albums.length} álbumes recibidos`);
          this.albums = albums;
          this.cargarPortadasDeAlbumes(albums);
        },
        error: (error) => {
          console.error('[loadInitialAlbums] Error al cargar álbumes iniciales:', error);
          this.albumsError = 'No se pudieron cargar los álbumes. Por favor, intenta nuevamente.';
          this.loadingAlbums = false;
        }
      });
  }

  /**
   * Carga canciones iniciales (populares)
   */
  private loadInitialSongs() {
    console.log('[loadInitialSongs] Cargando canciones iniciales');
    this.loadingSongs = true;
    this.songsError = null;

    this.exploreService.obtenerCancionesPopulares()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (songs) => {
          console.log(`[loadInitialSongs] ${songs.length} canciones recibidas`);
          this.songs = songs;
          this.isInitialLoad = false;
          this.cargarPortadasDeCanciones(songs);
        },
        error: (error) => {
          console.error('[loadInitialSongs] Error al cargar canciones iniciales:', error);
          this.songsError = 'No se pudieron cargar las canciones. Por favor, intenta nuevamente.';
          this.loadingSongs = false;
          this.isInitialLoad = false;
        }
      });
  }

  /**
   * Busca álbumes según los filtros aplicados
   */
  private searchAlbums() {
    console.log('[searchAlbums] Iniciando búsqueda de álbumes');
    this.loadingAlbums = true;
    this.albumsError = null;

    const searchName = this.searchTerm.trim() || undefined;
    const genreId = this.selectedGenre || undefined;

    this.exploreService.explorarAlbumes(searchName, genreId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (albums) => {
          console.log(`[searchAlbums] ${albums.length} álbumes encontrados`);
          this.albums = albums;
          this.hasSearched = true;
          this.cargarPortadasDeAlbumes(albums);
        },
        error: (error) => {
          console.error('[searchAlbums] Error en la búsqueda:', error);
          this.albumsError = 'Error al buscar álbumes. Por favor, intenta nuevamente.';
          this.loadingAlbums = false;
          this.hasSearched = true;
        }
      });
  }

  /**
   * Busca canciones según los filtros aplicados
   */
  private searchSongs() {
    console.log('[searchSongs] Iniciando búsqueda de canciones');
    this.loadingSongs = true;
    this.songsError = null;

    const searchName = this.searchTerm.trim() || undefined;
    const genreId = this.selectedGenre || undefined;

    this.exploreService.explorarCanciones(searchName, genreId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (songs) => {
          console.log(`[searchSongs] ${songs.length} canciones encontradas`);
          this.songs = songs;
          this.hasSearched = true;
          this.cargarPortadasDeCanciones(songs);
        },
        error: (error) => {
          console.error('[searchSongs] Error en la búsqueda:', error);
          this.songsError = 'Error al buscar canciones. Por favor, intenta nuevamente.';
          this.loadingSongs = false;
          this.hasSearched = true;
        }
      });
  }

  /**
   * Carga las portadas de los álbumes
   */
  private cargarPortadasDeAlbumes(albums: ResponseAlbumDto[]) {
    console.log('[cargarPortadasDeAlbumes] Iniciando carga de portadas');

    if (albums.length === 0) {
      this.loadingAlbums = false;
      return;
    }

    // Limpiar portadas anteriores
    this.albumCovers.clear();

    // Crear un observable para cada portada
    const portadaObservables = albums.map(album => {
      return this.songsService.obtenerPortadaPorId(album.id).pipe(
        map(blob => {
          const objectUrl = URL.createObjectURL(blob);
          return {
            albumId: album.id,
            portadaUrl: this.sanitizer.bypassSecurityTrustUrl(objectUrl)
          };
        }),
        catchError(error => {
          console.error(`[cargarPortadasDeAlbumes] Error cargando portada del álbum ${album.id}:`, error);
          return of(null);
        })
      );
    });

    // Ejecutar todas las solicitudes en paralelo
    forkJoin(portadaObservables).pipe(
      finalize(() => {
        this.loadingAlbums = false;
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (results) => {
        console.log(`[cargarPortadasDeAlbumes] Portadas cargadas: ${results.length}`);
        results.forEach(result => {
          if (result) {
            this.albumCovers.set(result.albumId, result.portadaUrl);
          }
        });
      },
      error: (error) => {
        console.error('[cargarPortadasDeAlbumes] Error general cargando portadas:', error);
      }
    });
  }

  /**
   * Carga las portadas de las canciones
   */
  private cargarPortadasDeCanciones(songs: ResponseSongPortadaDto[]) {
    console.log('[cargarPortadasDeCanciones] Iniciando carga de portadas de canciones');

    if (songs.length === 0) {
      this.loadingSongs = false;
      return;
    }

    // Limpiar portadas anteriores
    this.songCovers.clear();

    // Crear un observable para cada portada (igual que los álbumes)
    const portadaObservables = songs.map(song => {
      // Verificar si la canción tiene portada
      if (!song.portada || !song.portada.id) {
        console.warn(`[cargarPortadasDeCanciones] Canción ${song.id} no tiene portada`);
        return of(null);
      }

      return this.songsService.obtenerPortadaPorId(song.portada.id).pipe(
        map(blob => {
          const objectUrl = URL.createObjectURL(blob);
          return {
            songId: song.id,
            portadaUrl: this.sanitizer.bypassSecurityTrustUrl(objectUrl)
          };
        }),
        catchError(error => {
          console.error(`[cargarPortadasDeCanciones] Error cargando portada de la canción ${song.id}:`, error);
          return of(null);
        })
      );
    });

    // Ejecutar todas las solicitudes en paralelo
    forkJoin(portadaObservables).pipe(
      finalize(() => {
        this.loadingSongs = false;
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (results) => {
        console.log(`[cargarPortadasDeCanciones] Portadas de canciones procesadas: ${results.length}`);
        results.forEach(result => {
          if (result) {
            this.songCovers.set(result.songId, result.portadaUrl);
          }
        });
        console.log(`[cargarPortadasDeCanciones] ${this.songCovers.size} portadas de canciones cargadas exitosamente`);
      },
      error: (error) => {
        console.error('[cargarPortadasDeCanciones] Error general cargando portadas de canciones:', error);
      }
    });
  }

  /**
   * Obtiene la portada de un álbum
   */
  getAlbumCover(albumId: number): SafeUrl | null {
    return this.albumCovers.get(albumId) || null;
  }

  /**
   * Obtiene la portada de una canción
   */
  getSongCover(songId: number): SafeUrl | null {
    return this.songCovers.get(songId) || null;
  }

  /**
   * Navega a la página de detalle del álbum
   */
  goToAlbum(slug: string): void {
    this.router.navigate(['/album', slug]);
  }

  /**
   * Navega al perfil del usuario
   */
  goToUserProfile(slug: string): void {
    this.router.navigate(['/profile', slug]);
  }

  /**
   * Reproduce una canción usando el PlayerService
   */
  playSong(song: ResponseSongPortadaDto): void {
    console.log('[playSong] Reproduciendo canción:', song.name);

    // Convertir ResponseSongPortadaDto a ResponseSongDto para el player
    const songForPlayer = {
      id: song.id,
      name: song.name,
      description: song.description,
      duration: song.duration,
      owner: song.owner,
      fileUrl: song.fileUrl,
      genero: song.genero,
      subgenero: song.subgenero,
      estilo: song.estilo,
      slug: song.slug,
      artistasFt: song.artistasFt,
      likes: song.likes,
      dislikes: song.dislikes,
      playCount: song.playCount
    };

    // Obtener la portada de la canción
    const albumCover = this.getSongCover(song.id);

    // Por ahora, pasamos datos básicos del owner (se puede mejorar obteniendo datos completos del usuario)
    const owner: UserDescription = {
      artistasSeguidos: [], createdAt: "", followedsCount: 0, followersCount: 0, rol: "", slug: "", urlimage: "",
      id: song.owner,
      username: `Usuario ${song.owner}`, // Placeholder
      description: ''
    };

    // Reproducir la canción
    this.playerService.playSong(
      songForPlayer,
      albumCover,
      owner,
      [], // featuredArtists - se puede mejorar obteniendo datos completos
      [songForPlayer], // queue con solo esta canción
      0 // currentIndex
    );
  }

  /**
   * Formatea la duración en segundos a formato mm:ss
   */
  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }

  /**
   * Formatea el número de seguidores
   */
  formatFollowersCount(count: number): string {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  }

  toggleFilter(filterKey: string) {
    const filter = this.filters.find(f => f.key === filterKey);
    if (!filter) return;

    const activeFilters = this.filters.filter(f => f.active);

    // No permitir desactivar si solo quedan 2 filtros activos
    if (activeFilters.length <= 2 && filter.active) {
      return;
    }

    filter.active = !filter.active;

    // Desactivar filtro de género si álbumes y canciones están desactivados
    const albumsActive = this.filters.find(f => f.key === 'albums')?.active;
    const songsActive = this.filters.find(f => f.key === 'songs')?.active;

    if (!albumsActive && !songsActive) {
      this.selectedGenre = null;
    }

    // Realizar nueva búsqueda si se cambió algún filtro activo
    if (this.hasSearched || !this.isInitialLoad) {
      this.onSearch();
    }
  }

  get isGenreFilterDisabled(): boolean {
    const albumsActive = this.filters.find(f => f.key === 'albums')?.active;
    const songsActive = this.filters.find(f => f.key === 'songs')?.active;
    return !albumsActive && !songsActive;
  }

  get activeFilters(): FilterType[] {
    return this.filters.filter(f => f.active);
  }

  get isAlbumsActive(): boolean {
    return this.filters.find(f => f.key === 'albums')?.active || false;
  }

  get isSongsActive(): boolean {
    return this.filters.find(f => f.key === 'songs')?.active || false;
  }

  get isArtistsActive(): boolean {
    return this.filters.find(f => f.key === 'artists')?.active || false;
  }

  get isListenersActive(): boolean {
    return this.filters.find(f => f.key === 'listeners')?.active || false;
  }

  get albumsCount(): number {
    return this.albums.length;
  }

  get songsCount(): number {
    return this.songs.length;
  }

  get artistsCount(): number {
    return this.artists.length;
  }

  get listenersCount(): number {
    return this.listeners.length;
  }

  get showEmptyAlbumsState(): boolean {
    return this.isAlbumsActive && !this.loadingAlbums && this.albums.length === 0 && (this.hasSearched || !this.isInitialLoad);
  }

  get showEmptySongsState(): boolean {
    return this.isSongsActive && !this.loadingSongs && this.songs.length === 0 && (this.hasSearched || !this.isInitialLoad);
  }

  get showEmptyArtistsState(): boolean {
    return this.isArtistsActive && !this.loadingUsers && this.artists.length === 0 && (this.hasSearched || !this.isInitialLoad);
  }

  get showEmptyListenersState(): boolean {
    return this.isListenersActive && !this.loadingUsers && this.listeners.length === 0 && (this.hasSearched || !this.isInitialLoad);
  }

  get showAlbumsLoading(): boolean {
    return this.isAlbumsActive && this.loadingAlbums;
  }

  get showSongsLoading(): boolean {
    return this.isSongsActive && this.loadingSongs;
  }

  get showUsersLoading(): boolean {
    return (this.isArtistsActive || this.isListenersActive) && this.loadingUsers;
  }

  get showAlbumsError(): boolean {
    return this.isAlbumsActive && !!this.albumsError && !this.loadingAlbums;
  }

  get showSongsError(): boolean {
    return this.isSongsActive && !!this.songsError && !this.loadingSongs;
  }

  get showUsersError(): boolean {
    return (this.isArtistsActive || this.isListenersActive) && !!this.usersError && !this.loadingUsers;
  }

  get showAlbumsList(): boolean {
    return this.isAlbumsActive && !this.loadingAlbums && !this.albumsError && this.albums.length > 0;
  }

  get showSongsList(): boolean {
    return this.isSongsActive && !this.loadingSongs && !this.songsError && this.songs.length > 0;
  }

  get showArtistsList(): boolean {
    return this.isArtistsActive && !this.loadingUsers && !this.usersError && this.artists.length > 0;
  }

  get showListenersList(): boolean {
    return this.isListenersActive && !this.loadingUsers && !this.usersError && this.listeners.length > 0;
  }

  // Método para manejar el cambio en el select de género
  onGenreChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const value = target.value;

    if (value === 'null' || value === '') {
      this.selectedGenre = null;
    } else {
      this.selectedGenre = parseInt(value, 10);
    }

    console.log('[onGenreChange] Genre changed to:', this.selectedGenre);
    this.onSearch();
  }

  // Método auxiliar para obtener el nombre del género seleccionado
  getSelectedGenreName(): string {
    if (!this.selectedGenre) return 'Todos los géneros';
    const genre = this.genres.find(g => g.id === this.selectedGenre);
    return genre ? genre.name : 'Todos los géneros';
  }

  onSearch() {
    console.log('[onSearch] Iniciando búsqueda');
    console.log('[onSearch] Término:', this.searchTerm);
    console.log('[onSearch] Filtros activos:', this.activeFilters);
    console.log('[onSearch] Género seleccionado:', this.selectedGenre);

    // Buscar álbumes si el filtro está activo
    if (this.isAlbumsActive) {
      this.searchAlbums();
    } else {
      // Si no está activo, limpiar los resultados
      this.albums = [];
      this.albumCovers.clear();
    }

    // Buscar canciones si el filtro está activo
    if (this.isSongsActive) {
      this.searchSongs();
    } else {
      // Si no está activo, limpiar los resultados
      this.songs = [];
      this.songCovers.clear();
    }

    // Buscar usuarios si algún filtro de usuarios está activo
    if (this.isArtistsActive || this.isListenersActive) {
      this.searchUsers();
    } else {
      // Si no están activos, limpiar los resultados
      this.artists = [];
      this.listeners = [];
    }

    this.hasSearched = true;
  }

  /**
   * Resetea la búsqueda y vuelve a cargar contenido popular
   */
  resetSearch() {
    this.searchTerm = '';
    this.selectedGenre = null;
    this.hasSearched = false;
    this.albumsError = null;
    this.songsError = null;
    this.usersError = null;
    this.loadInitialContent();
  }
}
