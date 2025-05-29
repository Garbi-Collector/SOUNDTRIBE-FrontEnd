import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { AlbumService } from '../../services/album.service';
import { ModalService, ModalType } from '../../services/modal.service';
import { NumbersService } from '../../services/numbers.service';
import { UserDescription } from '../../dtos/usuarios/users.dto';
import { switchMap, tap, of, catchError } from "rxjs";
import { DOCUMENT } from '@angular/common';
import { Inject } from '@angular/core';
import { ResponseAlbumDto } from "../../dtos/albumes/musics.response.dto";
import { SongsService } from '../../services/songs.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

declare var bootstrap: any;

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css']
})
export class PerfilComponent implements OnInit {
  userProfile: UserDescription | null = null;
  isOwnProfile = false;
  isLoading = true;
  error: string | null = null;
  isAuthenticated = false;
  slug: string | null = null;
  isFollowing = false;
  isFollowingLoading = false;
  settingsDropdownOpen = false;
  shareToast: any;

  // Propiedades para álbumes
  userAlbums: ResponseAlbumDto[] = [];
  isLoadingAlbums = false;
  albumCovers: Map<number, SafeUrl> = new Map();
  isArtista = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private authService: AuthService,
    private modalService: ModalService,
    public numbersService: NumbersService,
    private albumService: AlbumService,
    private songsService: SongsService,
    private sanitizer: DomSanitizer,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    this.authService.isAuthenticated$.subscribe(isAuth => {
      this.isAuthenticated = isAuth;

      // Obtener el slug de la URL
      this.route.paramMap.subscribe(params => {
        this.slug = params.get('slug');

        if (this.slug) {
          // Si hay un slug en la URL, cargar perfil basado en ese slug
          this.loadUserProfileBySlug(this.slug);
        } else if (this.isAuthenticated) {
          // Si no hay slug pero el usuario está autenticado, redirigir a su propio perfil
          this.redirectToOwnProfile();
        } else {
          // Si no hay slug y no está autenticado, redirigir a inicio
          this.router.navigate(['/inicio']);
        }
      });
    });

    // Inicializar el toast para compartir
    setTimeout(() => {
      this.shareToast = new bootstrap.Toast(document.getElementById('shareToast'));
    }, 200);
  }

  // Nuevo méto-do para redireccionar al perfil propio usando el slug del usuario autenticado
  redirectToOwnProfile(): void {
    this.userService.getAuthenticatedUser().subscribe({
      next: (user) => {
        if (user && user.slug) {
          this.router.navigate(['/perfil', user.slug]);
        } else {
          this.error = 'No se pudo obtener el perfil del usuario.';
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Error obteniendo perfil del usuario:', err);
        this.error = 'No se pudo obtener el perfil del usuario.';
        this.isLoading = false;
      }
    });
  }

  loadUserProfileBySlug(slug: string): void {
    this.isLoading = true;
    this.error = null;

    this.userService.getUserDescriptionBySlug(slug).subscribe({
      next: (profile) => {
        this.userProfile = profile;
        this.isArtista = profile.rol === 'ARTISTA';

        // Verificar si es el perfil propio comparando con el username actual
        const currentUsername = this.authService.getCurrentUsername();
        this.isOwnProfile = currentUsername === profile.username;

        // Solo verificar el estado de seguimiento si no es el perfil propio y el usuario está autenticado
        if (this.isAuthenticated && !this.isOwnProfile) {
          this.checkFollowingStatus(profile.id);
        }

        // Cargar álbumes solo si es un artista
        if (this.isArtista) {
          this.loadUserAlbums(profile.id);
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading profile:', err);
        this.error = 'No se pudo cargar el perfil. Por favor, intenta nuevamente.';
        this.isLoading = false;
      }
    });
  }

  // Método para cargar los álbumes del artista
  loadUserAlbums(artistId: number): void {
    this.isLoadingAlbums = true;

    this.albumService.getAlbumsByArtist(artistId).subscribe({
      next: (albums) => {
        this.userAlbums = albums;
        this.isLoadingAlbums = false;

        // Cargar las portadas de los álbumes
        this.loadAlbumCovers();
      },
      error: (err) => {
        console.error('Error cargando álbumes:', err);
        this.isLoadingAlbums = false;
      }
    });
  }

  // Método para cargar las portadas de los álbumes
  loadAlbumCovers(): void {
    this.userAlbums.forEach(album => {
      this.songsService.obtenerPortadaPorId(album.id).subscribe({
        next: (blob) => {
          const objectUrl = URL.createObjectURL(blob);
          const safeUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
          this.albumCovers.set(album.id, safeUrl);
        },
        error: (err) => {
          console.error(`Error cargando portada para álbum ${album.id}:`, err);
        }
      });
    });
  }

// Méto do para navegar a la página del álbum
  navigateToAlbum(album: ResponseAlbumDto): void {
    if (album) {
      // Verificar que el álbum tiene un slug
      if (album.slug) {
        // Navegar usando la nueva ruta de álbum
        this.router.navigate(['/album', album.slug]);
      } else {
        // Si no hay slug disponible, devolver un error o algo mas ameno para decir que el album con ese slug no existe
      }
    }
  }

  // Métodos para el botón de configuración
  toggleSettingsDropdown(event: Event): void {
    event.stopPropagation();
    this.settingsDropdownOpen = !this.settingsDropdownOpen;

    // Cerrar dropdown al hacer clic fuera
    if (this.settingsDropdownOpen) {
      setTimeout(() => {
        this.document.addEventListener('click', this.closeSettingsDropdownOnOutsideClick);
      });
    } else {
      this.document.removeEventListener('click', this.closeSettingsDropdownOnOutsideClick);
    }
  }

  closeSettingsDropdownOnOutsideClick = (): void => {
    this.settingsDropdownOpen = false;
    this.document.removeEventListener('click', this.closeSettingsDropdownOnOutsideClick);
  };

  closeSettingsDropdown(): void {
    this.settingsDropdownOpen = false;
    this.document.removeEventListener('click', this.closeSettingsDropdownOnOutsideClick);
  }

  // Métodos para abrir modales
  openChangePasswordModal() {
    this.modalService.openModal(ModalType.ChangePassword);
  }

  openChangeSlugModal() {
    this.modalService.openModal(ModalType.ChangeSlug);
  }

  shareProfile(): void {
    const currentUrl = this.document.location.href;

    // Check if clipboard API is available
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(currentUrl)
        .then(() => {
          if (this.shareToast) {
            this.shareToast.show();
          }
        })
        .catch(err => {
          console.error('Error al copiar la URL: ', err);
          this.useFallbackCopy(currentUrl);
        });
    } else {
      // Use fallback for non-secure contexts
      this.useFallbackCopy(currentUrl);
    }
  }

  private useFallbackCopy(text: string): void {
    try {
      const tempInput = document.createElement('input');
      tempInput.style.position = 'absolute';
      tempInput.style.left = '-9999px';
      tempInput.value = text;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);

      if (this.shareToast) {
        this.shareToast.show();
      }
    } catch (err) {
      console.error('Fallback copy failed:', err);
    }
  }

  // El resto de los métodos quedan igual
  checkFollowingStatus(profileId: number): void {
    this.userService.isFollowing(profileId).subscribe({
      next: (isFollowing) => {
        this.isFollowing = isFollowing;
      },
      error: (err) => {
        console.error('Error checking follow status:', err);
        this.isFollowing = false;
      }
    });
  }

  openAuthModal() {
    this.modalService.openModal(ModalType.Auth);
  }

  openDescriptionModal() {
    this.modalService.openModal(ModalType.ChangeDescription);
  }

  followUser(): void {
    if (!this.isAuthenticated) {
      this.openAuthModal();
      return;
    }

    if (!this.userProfile) return;

    this.isFollowingLoading = true;
    this.userService.followUser(this.userProfile.id).subscribe({
      next: (response) => {
        this.isFollowing = true;
        if (this.userProfile) {
          this.userProfile.followersCount++;
        }
        this.isFollowingLoading = false;
      },
      error: (err) => {
        console.error('Error following user:', err);
        this.isFollowingLoading = false;
      }
    });
  }

  unfollowUser(): void {
    if (!this.isAuthenticated || !this.userProfile) return;

    this.isFollowingLoading = true;
    this.userService.unfollowUser(this.userProfile.id).subscribe({
      next: (response) => {
        this.isFollowing = false;
        if (this.userProfile && this.userProfile.followersCount > 0) {
          this.userProfile.followersCount--;
        }
        this.isFollowingLoading = false;
      },
      error: (err) => {
        console.error('Error unfollowing user:', err);
        this.isFollowingLoading = false;
      }
    });
  }

  toggleFollow(): void {
    if (this.isFollowing) {
      this.unfollowUser();
    } else {
      this.followUser();
    }
  }

  goToArtistProfile(slug: string): void {
    if (slug) {
      this.router.navigate(['/perfil', slug]);
    }
  }

  // Méto-do para navegar a la página de eliminar cuenta
  navigateToDeleteAccount(): void {
    this.router.navigate(['/eliminate-account']);
  }

}
