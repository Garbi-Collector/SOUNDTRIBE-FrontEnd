import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { forkJoin, of, interval } from 'rxjs';
import { catchError, map, tap, finalize } from 'rxjs/operators';

import { HomeService } from '../../services/home.service';
import { SongsService } from '../../services/songs.service';
import {ResponseAlbumDto, ResponseSongDto} from '../../dtos/albumes/musics.response.dto';
import {PlayerService} from "../../services/player.service";

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.css']
})
export class InicioComponent implements OnInit {
  // Referencias a los elementos de los carruseles
  @ViewChild('albumsCarousel') albumsCarousel!: ElementRef;
  @ViewChild('votedAlbumsCarousel') votedAlbumsCarousel!: ElementRef;
  @ViewChild('escuchadosAlbumsCarousel') escuchadosAlbumsCarousel!: ElementRef;
  @ViewChild('onFireCancionesCarousel') onFireCancionesCarousel!: ElementRef;

  // Estado de carga general de la página
  isPageLoading = true;
  loadingMessage = 'Cargando SoundTribe...';

  // Contador para seguir el estado de carga de cada sección
  loadingSectionsTotal = 3; // Total de secciones a cargar (recientes, votados, escuchados)
  loadingSectionsCompleted = 0;

  // Propiedades para el carrusel de álbumes recientes
  albumesRecientes: ResponseAlbumDto[] = [];
  albumCovers: Map<number, SafeUrl> = new Map();
  isLoading = true;
  error: string | null = null;

  // Propiedades para el carrusel de álbumes más votados
  albumesMasVotados: ResponseAlbumDto[] = [];
  isLoadingVotados = true;
  errorVotados: string | null = null;

  // Propiedades para el carrusel de álbumes más escuchados
  albumesMasescuchados: ResponseAlbumDto[] = [];
  isLoadingescuchados = true;
  errorescuchados: string | null = null;

  // Propiedades para el carrusel de canciones onfire
  cancionesOnfire: ResponseSongDto[] = [];
  AlbumesByOnfire: ResponseAlbumDto[] = [];
  isLoadingOnfire = true;
  errorOnfire: string | null = null;

  // Control de scroll para álbumes recientes
  scrollPosition = 0;
  maxScrollPosition = 0;
  scrollAmount = 300; // Cantidad de píxeles para desplazar en cada clic

  // Control de scroll para álbumes más votados
  scrollPositionVotados = 0;
  maxScrollPositionVotados = 0;

  // Control de scroll para álbumes más escuchados
  scrollPositionEscuchados = 0;
  maxScrollPositionEscuchados = 0;

  // Control de scroll para canciones onfire
  scrollPositionOnfire = 0;
  maxScrollPositionOnfire = 0;

  // Para el reloj
  currentTime: string = '';

  constructor(
    private homeService: HomeService,
    private songsService: SongsService,
    private playerService: PlayerService,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.resetLoadingCounter();
    this.cargarAlbumesRecientes();
    this.cargarAlbumesMasVotados();
    this.cargarAlbumesMasEscuchados();
    this.startClock();
  }

  /**
   * Reinicia el contador de secciones cargadas
   */
  resetLoadingCounter(): void {
    this.loadingSectionsCompleted = 0;
    this.isPageLoading = true;
  }

  /**
   * Verifica si todas las secciones han terminado de cargar
   */
  checkAllSectionsLoaded(): void {
    this.loadingSectionsCompleted++;

    if (this.loadingSectionsCompleted >= this.loadingSectionsTotal) {

      // Usar un setTimeout más largo para asegurar que los elementos estén renderizados
      setTimeout(() => {
        this.isPageLoading = false;
        // Inicializar las posiciones de scroll después de que la página esté visible
        setTimeout(() => {
          this.initializeScrollPositions();
        }, 100);
      }, 800);
    }
  }

  /**
   * Inicializa las posiciones máximas de scroll para todos los carruseles
   */
  initializeScrollPositions(): void {

    this.updateMaxScrollPosition();
    this.updateMaxScrollPositionVotados();
    this.updateMaxScrollPositionEscuchados();
  }

  /**
   * Actualiza el mensaje de carga
   */
  updateLoadingMessage(message: string): void {
    this.loadingMessage = message;
  }

  /**
   * Inicia el reloj y actualiza la hora cada segundo
   */
  startClock(): void {
    // Establecer la hora inicial
    this.updateTime();

    // Actualizar la hora cada segundo
    interval(1000).subscribe(() => {
      this.updateTime();
    });
  }

  /**
   * Actualiza la hora actual en formato HH:MM:SS
   */
  updateTime(): void {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    this.currentTime = `${hours}:${minutes}:${seconds}`;
  }

  /**
   * Carga los álbumes más recientes desde el servicio
   */
  cargarAlbumesRecientes(): void {

    this.updateLoadingMessage('Cargando álbumes recientes...');
    this.isLoading = true;
    this.error = null;

    this.homeService.getAlbumesRecientes().subscribe({
      next: (albumes) => {

        this.albumesRecientes = albumes;

        // Una vez que tenemos los álbumes, cargamos las portadas
        this.cargarPortadasDeAlbumes(albumes);
      },
      error: (err) => {
        console.error('[cargarAlbumesRecientes] Error al cargar álbumes:', err);
        this.error = 'No se pudieron cargar los álbumes recientes. Por favor, intenta nuevamente.';
        this.isLoading = false;
        this.checkAllSectionsLoaded(); // Consideramos la sección como cargada incluso con error
      }
    });
  }

  /**
   * Carga los álbumes más votados desde el servicio
   */
  cargarAlbumesMasVotados(): void {

    this.updateLoadingMessage('Cargando álbumes más votados...');
    this.isLoadingVotados = true;
    this.errorVotados = null;

    this.homeService.getAlbumesMasVotados().subscribe({
      next: (albumes) => {

        this.albumesMasVotados = albumes;

        // Una vez que tenemos los álbumes, cargamos las portadas
        this.cargarPortadasDeAlbumes(albumes, 'votados');
      },
      error: (err) => {
        console.error('[cargarAlbumesMasVotados] Error al cargar álbumes más votados:', err);
        this.errorVotados = 'No se pudieron cargar los álbumes más votados. Por favor, intenta nuevamente.';
        this.isLoadingVotados = false;
        this.checkAllSectionsLoaded(); // Consideramos la sección como cargada incluso con error
      }
    });
  }

  /**
   * Carga los álbumes más escuchados desde el servicio
   */
  cargarAlbumesMasEscuchados(): void {

    this.updateLoadingMessage('Cargando álbumes más escuchados...');
    this.isLoadingescuchados = true;
    this.errorescuchados = null;

    this.homeService.getAlbumesMasEscuchados().subscribe({
      next: (albumes) => {

        this.albumesMasescuchados = albumes;

        // Una vez que tenemos los álbumes, cargamos las portadas
        this.cargarPortadasDeAlbumes(albumes, 'escuchados');
      },
      error: (err) => {
        console.error('[cargarAlbumesMasEscuchados] Error al cargar álbumes más escuchados:', err);
        this.errorescuchados = 'No se pudieron cargar los álbumes más escuchados. Por favor, intenta nuevamente.';
        this.isLoadingescuchados = false;
        this.checkAllSectionsLoaded(); // Consideramos la sección como cargada incluso con error
      }
    });
  }

  /**
   * Carga las canciones onfire desde el servicio y sus álbumes correspondientes
   */
  cargarCancionesOnfire(): void {

    this.updateLoadingMessage('Cargando canciones populares...');
    this.isLoadingOnfire = true;
    this.errorOnfire = null;

    this.homeService.getCancionesOnFire().subscribe({
      next: (canciones) => {

        this.cancionesOnfire = canciones;

        // Una vez que tenemos las canciones, obtenemos los álbumes correspondientes
        this.cargarAlbumesDeCanciones(canciones);
      },
      error: (err) => {
        console.error('[cargarCancionesOnfire] Error al cargar canciones onfire:', err);
        this.errorOnfire = 'No se pudieron cargar las canciones onfire. Por favor, intenta nuevamente.';
        this.isLoadingOnfire = false;
      }
    });
  }

  /**
   * Carga los álbumes correspondientes a cada canción onfire
   * @param canciones Lista de canciones onfire
   */
  cargarAlbumesDeCanciones(canciones: ResponseSongDto[]): void {


    if (canciones.length === 0) {
      this.isLoadingOnfire = false;
      return;
    }

    // Crear un observable para cada álbum que necesitamos cargar
    const albumObservables = canciones.map(cancion => {
      return this.homeService.getAlbumBySong(cancion.id).pipe(
        map(album => {
          return {
            cancionId: cancion.id,
            album: album
          };
        }),
        catchError(error => {
          console.error(`[cargarAlbumesDeCanciones] Error cargando álbum para la canción ${cancion.id}:`, error);
          return of(null);
        })
      );
    });

    // Ejecutar todas las solicitudes en paralelo
    forkJoin(albumObservables).subscribe({
      next: (results) => {


        // Almacenar los álbumes en el array de álbumes por canción onfire
        this.AlbumesByOnfire = results
          .filter(result => result !== null)
          .map(result => result!.album);

        // Una vez que tenemos los álbumes, cargamos las portadas
        this.cargarPortadasDeAlbumes(this.AlbumesByOnfire, 'onfire');

        // Actualizar el máximo scroll position para las canciones onfire
        setTimeout(() => this.updateMaxScrollPositionOnfire(), 100);
      },
      error: (err) => {
        console.error(`[cargarAlbumesDeCanciones] Error general cargando álbumes para canciones onfire:`, err);
        this.isLoadingOnfire = false;
      }
    });
  }

  /**
   * Carga las portadas de los álbumes usando el ID de cada álbum
   * @param albumes Lista de álbumes
   * @param tipo Tipo de álbumes ('votados', 'escuchados' o '' para recientes)
   */
  cargarPortadasDeAlbumes(albumes: ResponseAlbumDto[], tipo: string = ''): void {
    let seccion = 'recientes';
    if (tipo === 'votados') seccion = 'más votados';
    if (tipo === 'escuchados') seccion = 'más escuchados';



    if (albumes.length === 0) {
      this.finalizarCargaSeccion(tipo);
      return;
    }

    // Crear un observable para cada portada que necesitamos cargar
    const portadaObservables = albumes.map(album => {
      return this.songsService.obtenerPortadaPorId(album.id).pipe(
        map(blob => {
          // Crear una URL segura para la portada
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
        // Asegurar que la sección se marque como cargada
        this.finalizarCargaSeccion(tipo);
      })
    ).subscribe({
      next: (results) => {


        // Almacenar las URLs de las portadas en el mapa
        results.forEach(result => {
          if (result) {
            this.albumCovers.set(result.albumId, result.portadaUrl);
          }
        });
      },
      error: (err) => {
        console.error(`[cargarPortadasDeAlbumes] Error general cargando portadas de álbumes ${seccion}:`, err);
      }
    });
  }

  /**
   * Finaliza la carga de una sección específica
   */
  private finalizarCargaSeccion(tipo: string): void {
    if (tipo === 'votados') {
      this.isLoadingVotados = false;
      this.checkAllSectionsLoaded();
    } else if (tipo === 'escuchados') {
      this.isLoadingescuchados = false;
      this.checkAllSectionsLoaded();
    } else if (tipo === 'onfire') {
      this.isLoadingOnfire = false;
      // onfire no cuenta para el loading general
    } else {
      this.isLoading = false;
      this.checkAllSectionsLoaded();
    }
  }

  /**
   * Navega a la página de detalle del álbum
   */
  goToAlbum(slug: string): void {
    this.router.navigate(['/album', slug]);
  }

  /**
   * Actualiza el valor máximo de scroll basado en el ancho del contenido para álbumes recientes
   */
  updateMaxScrollPosition(): void {
    if (this.albumsCarousel?.nativeElement) {
      const element = this.albumsCarousel.nativeElement;
      this.maxScrollPosition = Math.max(0, element.scrollWidth - element.clientWidth);

    }
  }

  /**
   * Actualiza el valor máximo de scroll basado en el ancho del contenido para álbumes votados
   */
  updateMaxScrollPositionVotados(): void {
    if (this.votedAlbumsCarousel?.nativeElement) {
      const element = this.votedAlbumsCarousel.nativeElement;
      this.maxScrollPositionVotados = Math.max(0, element.scrollWidth - element.clientWidth);

    }
  }

  /**
   * Actualiza el valor máximo de scroll basado en el ancho del contenido para álbumes escuchados
   */
  updateMaxScrollPositionEscuchados(): void {
    if (this.escuchadosAlbumsCarousel?.nativeElement) {
      const element = this.escuchadosAlbumsCarousel.nativeElement;
      this.maxScrollPositionEscuchados = Math.max(0, element.scrollWidth - element.clientWidth);

    }
  }

  /**
   * Actualiza el valor máximo de scroll basado en el ancho del contenido para canciones onfire
   */
  updateMaxScrollPositionOnfire(): void {
    if (this.onFireCancionesCarousel?.nativeElement) {
      const element = this.onFireCancionesCarousel.nativeElement;
      this.maxScrollPositionOnfire = Math.max(0, element.scrollWidth - element.clientWidth);

    }
  }

  /**
   * Desplaza el carrusel de álbumes recientes hacia la izquierda
   */
  scrollLeft(): void {
    if (this.albumsCarousel?.nativeElement) {
      const element = this.albumsCarousel.nativeElement;
      const newPosition = Math.max(0, this.scrollPosition - this.scrollAmount);
      element.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
      this.scrollPosition = newPosition;

    }
  }

  /**
   * Desplaza el carrusel de álbumes recientes hacia la derecha
   */
  scrollRight(): void {
    if (this.albumsCarousel?.nativeElement) {
      const element = this.albumsCarousel.nativeElement;
      const newPosition = Math.min(this.maxScrollPosition, this.scrollPosition + this.scrollAmount);
      element.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
      this.scrollPosition = newPosition;

    }
  }

  /**
   * Desplaza el carrusel de álbumes votados hacia la izquierda
   */
  scrollLeftVotados(): void {
    if (this.votedAlbumsCarousel?.nativeElement) {
      const element = this.votedAlbumsCarousel.nativeElement;
      const newPosition = Math.max(0, this.scrollPositionVotados - this.scrollAmount);
      element.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
      this.scrollPositionVotados = newPosition;

    }
  }

  /**
   * Desplaza el carrusel de álbumes votados hacia la derecha
   */
  scrollRightVotados(): void {
    if (this.votedAlbumsCarousel?.nativeElement) {
      const element = this.votedAlbumsCarousel.nativeElement;
      const newPosition = Math.min(this.maxScrollPositionVotados, this.scrollPositionVotados + this.scrollAmount);
      element.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
      this.scrollPositionVotados = newPosition;

    }
  }

  /**
   * Desplaza el carrusel de álbumes escuchados hacia la izquierda
   */
  scrollLeftEscuchados(): void {
    if (this.escuchadosAlbumsCarousel?.nativeElement) {
      const element = this.escuchadosAlbumsCarousel.nativeElement;
      const newPosition = Math.max(0, this.scrollPositionEscuchados - this.scrollAmount);
      element.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
      this.scrollPositionEscuchados = newPosition;

    }
  }

  /**
   * Desplaza el carrusel de álbumes escuchados hacia la derecha
   */
  scrollRightEscuchados(): void {
    if (this.escuchadosAlbumsCarousel?.nativeElement) {
      const element = this.escuchadosAlbumsCarousel.nativeElement;
      const newPosition = Math.min(this.maxScrollPositionEscuchados, this.scrollPositionEscuchados + this.scrollAmount);
      element.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
      this.scrollPositionEscuchados = newPosition;

    }
  }

  /**
   * Desplaza el carrusel de canciones onfire hacia la izquierda
   */
  scrollLeftOnfire(): void {
    if (this.onFireCancionesCarousel?.nativeElement) {
      const element = this.onFireCancionesCarousel.nativeElement;
      const newPosition = Math.max(0, this.scrollPositionOnfire - this.scrollAmount);
      element.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
      this.scrollPositionOnfire = newPosition;

    }
  }

  /**
   * Desplaza el carrusel de canciones onfire hacia la derecha
   */
  scrollRightOnfire(): void {
    if (this.onFireCancionesCarousel?.nativeElement) {
      const element = this.onFireCancionesCarousel.nativeElement;
      const newPosition = Math.min(this.maxScrollPositionOnfire, this.scrollPositionOnfire + this.scrollAmount);
      element.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
      this.scrollPositionOnfire = newPosition;

    }
  }

  /**
   * Listener para eventos de scroll en el carrusel de álbumes recientes
   */
  onScroll(event: Event): void {
    const element = event.target as HTMLElement;
    this.scrollPosition = element.scrollLeft;
  }

  /**
   * Listener para eventos de scroll en el carrusel de álbumes votados
   */
  onScrollVotados(event: Event): void {
    const element = event.target as HTMLElement;
    this.scrollPositionVotados = element.scrollLeft;
  }

  /**
   * Listener para eventos de scroll en el carrusel de álbumes escuchados
   */
  onScrollEscuchados(event: Event): void {
    const element = event.target as HTMLElement;
    this.scrollPositionEscuchados = element.scrollLeft;
  }

  /**
   * Listener para eventos de scroll en el carrusel de canciones onfire
   */
  onScrollOnfire(event: Event): void {
    const element = event.target as HTMLElement;
    this.scrollPositionOnfire = element.scrollLeft;
  }

  /**
   * Inicia la reproducción de una canción
   */
  playSong(song: ResponseSongDto): void {
    //this.playerService.playSong(song);
  }
}
