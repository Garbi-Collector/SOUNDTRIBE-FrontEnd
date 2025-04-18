import { Component, OnInit, HostListener, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserExperienceService } from '../../services/user-experience.service';
import { ThemeService } from "../../services/theme.service";
import { UserGet } from '../../services/user-experience.service';
import { RoutesBackService } from '../../../routes-back.service';

// Importa el tipo Dropdown de Bootstrap si lo tienes instalado
declare var bootstrap: any;

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, AfterViewInit {
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
  searchActive: boolean = true; // Por defecto activo en desktop

  toggleDropdown(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.dropdownOpen = !this.dropdownOpen;
  }

  closeDropdown() {
    this.dropdownOpen = false;
  }

  constructor(
    private themeService: ThemeService,
    private authService: AuthService,
    private userExperienceService: UserExperienceService,
    private router: Router,
    private routesBack: RoutesBackService
  ) {
    this.themeService.theme$.subscribe(theme => {
      this.isLightTheme = theme === 'light';
    });

    // Verificar si es móvil al inicio
    this.checkScreenSize();
  }

  // Modifica el listener de document:click existente para incluir el cierre del dropdown
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

  // Detectar cambios en el tamaño de la pantalla
  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth < 768;
    if (!this.isMobile) {
      this.searchActive = true; // Siempre visible en escritorio
    }
  }

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

        // Obtener todos los usuarios sin JWT si el usuario no está autenticado
        this.userExperienceService.getAllUsers().subscribe(response => {
          this.userList = response.usuarios;
        });
      }
    });
  }

  ngAfterViewInit() {
    // Inicializar dropdowns después de que la vista se haya cargado
    this.initBootstrapDropdowns();
  }

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

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/inicio']);
  }

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

  // Filtrar usuarios basado en la búsqueda
  filterUsers() {
    if (this.searchQuery.trim() === '') {
      this.filteredUsers = [];
    } else {
      this.filteredUsers = this.userList.filter(user =>
        user.username.toLowerCase().includes(this.searchQuery.toLowerCase())
      ).slice(0, 5); // Limitar a 5 resultados
    }
  }

  // Navegar al perfil del usuario seleccionado utilizando el slug
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

  // Limpiar la búsqueda
  clearSearch() {
    this.searchQuery = '';
    this.filteredUsers = [];
  }

  // Obtener la URL completa de la imagen
  getImageUrl(filename: string): string {
    // Verificar si la URL ya incluye la ruta completa
    if (filename.startsWith('http')) {
      return filename;
    }
    return `${this.routesBack.userServiceUrl}/fotos/image/${filename}`;
  }
}
