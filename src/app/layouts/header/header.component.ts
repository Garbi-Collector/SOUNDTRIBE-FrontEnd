import {AfterViewInit, Component, HostListener, OnInit} from '@angular/core';
import {UserGet} from "../../dtos/users.dto";
import {ModalService, ModalType} from "../../services/modal.service";
import {ThemeService} from "../../services/theme.service";
import {AuthService} from "../../services/auth.service";
import {UserService} from "../../services/user.service";
import {Router, RouterLink} from "@angular/router";
import {BackEndRoutesService} from "../../back-end.routes.service";



// Importa el tipo Dropdown de Bootstrap si lo tienes instalado
declare var bootstrap: any;



@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, AfterViewInit {
  isUserArtist: boolean = false;

  dropdownOpen = false;
  isLightTheme = false;
  isAuthenticated = false;
  userFotoUrl: string | undefined;
  userSlug: string | undefined;
  currentUser: UserGet | null = null;
  searchQuery: string = '';
  userList: UserGet[] = [];
  filteredUsers: UserGet[] = [];
  isMobile: boolean = false;
  searchActive: boolean = false; // Por defecto activo en desktop

  constructor(
    private modalService: ModalService,
    private themeService: ThemeService,
    private authService: AuthService,
    private userExperienceService: UserService,
    private router: Router,
    private routesBack: BackEndRoutesService
  ) {
    this.themeService.theme$.subscribe(theme => {
      this.isLightTheme = theme === 'light';
    });

    // Verificar si es móvil al inicio
    this.checkScreenSize();
  }



  //  logo  - theme mode

  /**
   * Se ejecuta al hacer clic en el logo. Cambia el tema y previene navegación.
   * @param event Evento del clic
   */
  onLogoClick(event: Event): void {
    event.preventDefault(); // evita la navegación
    this.toggleTheme();     // cambia el tema
  }

  /**
   * cambia el tema de la app
   */
  toggleTheme(): void {
    this.themeService.toggleTheme();
  }



  //  Buscador

  /**
   * filtra la lista de usuarios segun lo ingresado
   */
  filterUsers() {
    if (this.searchQuery.trim() === '') {
      this.filteredUsers = [];
    } else {
      this.filteredUsers = this.userList.filter(user =>
        user.username.toLowerCase().includes(this.searchQuery.toLowerCase())
      ).slice(0, 5); // Limitar a 5 resultados
    }
  }

  /**
   * redirige al perfil del usuario seleccionado
   */
  navigateToUserProfile(user: UserGet) {
    if (user && user.slug) {
      this.router.navigate(['/perfil', user.slug]);
    } else if (user && user.id) {
      // Fallback por si no hay slug
      this.router.navigate(['/perfil', user.id]);
    }
    this.clearSearch();
    if (this.isMobile) {
      this.searchActive = false;
    }
  }

  /**
   * limpia el input y los resultados de busqueda
   */
  clearSearch() {
    this.searchQuery = '';
    this.filteredUsers = [];
  }

  /**
   * alterna el buscador visible en moviles
   */
  toggleSearchMobile(event: Event): void {
    event.stopPropagation();
    this.searchActive = !this.searchActive;
    if (this.searchActive) {
      setTimeout(() => {
        const searchInput = document.querySelector('.search-container input');
        if (searchInput) {
          (searchInput as HTMLElement).focus();
        }
      }, 100);
    } else {
      this.clearSearch();
    }
  }

  /**
   * Genera la url completa de la imagen del usuario
   */
  getImageUrl(filename: string): string {
    // Verificar si la URL ya incluye la ruta completa
    if (filename.startsWith('http')) {
      return filename;
    }
    return `${this.routesBack.userServiceUrl}/fotos/image/${filename}`;
  }


  //    Perfil  - Autenticacion

  /**
   * abre o cierra el menu del usuario
   */
  toggleDropdown(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.dropdownOpen = !this.dropdownOpen;
  }

  /**
   * cierra el menu del usuario
   */
  closeDropdown() {
    this.dropdownOpen = false;
  }

  /**
   * cierra la sesion y redirige al inicio
   */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/inicio']);
  }

  /**
   * abre el modal de Auth
   */
  openAuthModal() {
    this.modalService.openModal(ModalType.Auth);
  }

  //    Responsive  -   UI general

  /**
   * Detecta clics fuera del dropdown o buscador para cerrarlos
   */
  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    // Cerrar el dropdown si está abierto y se hace clic fuera
    if (this.dropdownOpen) {
      const dropdownContainer = document.querySelector('.user-menu');
      if (dropdownContainer && !dropdownContainer.contains(event.target as Node)) {
        this.closeDropdown();
      }
    }

    // Código existente para cerrar los resultados de búsqueda...
    if (this.filteredUsers.length > 0) {
      const searchContainer = document.querySelector('.search-container');
      if (searchContainer && !searchContainer.contains(event.target as Node)) {
        this.clearSearch();
      }
    }

    // Código existente para cerrar la búsqueda en móvil...
    if (this.isMobile && this.searchActive) {
      const searchWrapper = document.querySelector('.search-wrapper');
      const searchToggleBtn = document.querySelector('.search-toggle-btn');
      if (
        searchWrapper &&
        !searchWrapper.contains(event.target as Node) &&
        searchToggleBtn &&
        !searchToggleBtn.contains(event.target as Node)
      ) {
        this.searchActive = false;
      }
    }
  }

  /**
   * Detecta cambio de tamaño de pantalla
   */
  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  /**
   * Establece si el dispositivo es móvil y ajusta visibilidad del buscador
   */
  checkScreenSize() {
    this.isMobile = window.innerWidth < 768;
    if (!this.isMobile) {
      this.searchActive = true; // Siempre visible en escritorio
    }
  }

  //    Inicialización Bootstrap

  /**
   * Inicializa manualmente los dropdowns de Bootstrap si no están disponibles globalmente
   */
  initBootstrapDropdowns() {
    // Inicializar los dropdowns de Bootstrap 5
    if (typeof document !== 'undefined' && typeof bootstrap !== 'undefined') {
      const dropdownElementList = document.querySelectorAll('.dropdown-toggle, [data-bs-toggle="dropdown"]');
      dropdownElementList.forEach(el => {
        new bootstrap.Dropdown(el);
      });
    } else {
      // Si bootstrap no está disponible como variable global,
      // podemos inicializar manualmente el dropdown
      const dropdownItems = document.querySelectorAll('.dropdown-item');
      const dropdownButton = document.querySelector('#userDropdown');

      if (dropdownButton) {
        dropdownButton.addEventListener('click', function() {
          const dropdownMenu = document.querySelector('.dropdown-menu');
          if (dropdownMenu) {
            dropdownMenu.classList.toggle('show');
          }
        });
      }

      // Cerrar dropdown al hacer clic fuera
      document.addEventListener('click', (event) => {
        if (!event.target || !(event.target as Element).closest('.dropdown')) {
          const dropdowns = document.querySelectorAll('.dropdown-menu.show');
          dropdowns.forEach(dropdown => {
            dropdown.classList.remove('show');
          });
        }
      });
    }
  }

  //    Ciclos de Vida Angular

  /**
   * se subscribe al tema.
   * se subscribe al estado de autenticacion y carga los datos del usuario y la lista de usuarios
   */
  ngOnInit() {
    // Suscribirse al tema actual
    this.themeService.currentTheme().subscribe(isLight => {
      this.isLightTheme = isLight;
    });
    this.authService.isAuthenticated$.subscribe(isAuth => {
      this.isAuthenticated = isAuth;
      if (isAuth) {
        // Obtener los detalles del usuario autenticado
        this.userExperienceService.getAuthenticatedUser().subscribe(user => {
          this.userFotoUrl = user.urlFoto;
          this.userSlug = user.slug;
          this.currentUser = user;

          // Verificar si el usuario es artista
          this.isUserArtist = this.authService.isArtista();
        });

        // Obtener todos los usuarios con JWT solo si el usuario está autenticado
        this.userExperienceService.getAllUsersWithJwt().subscribe(response => {
          this.userList = response.usuarios;
        });
      } else {
        // Limpiar foto cuando el usuario cierra sesión
        this.userFotoUrl = undefined;
        this.userSlug = undefined;
        this.currentUser = null;
        this.isUserArtist = false; // Reiniciar la bandera cuando el usuario cierra sesión


        // Obtener todos los usuarios sin JWT si el usuario no está autenticado
        this.userExperienceService.getAllUsers().subscribe(response => {
          this.userList = response.usuarios;
        });
      }
    });
  }

  /**
   * Inicializa el dropdown de Bootstrap al terminar de renderizar la vista
   */
  ngAfterViewInit() {
    // Inicializar dropdowns después de que la vista se haya cargado
    this.initBootstrapDropdowns();
  }


}
