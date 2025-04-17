import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserExperienceService } from '../../services/user-experience.service';
import { ThemeService } from "../../services/theme.service";
import { UserGet } from '../../services/user-experience.service';
import { RoutesBackService } from '../../../routes-back.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  isLightTheme = false;
  isAuthenticated = false;
  userFotoUrl: string | undefined;
  searchQuery: string = '';
  userList: UserGet[] = [];
  filteredUsers: UserGet[] = [];

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
  }

  // Detectar clics fuera del buscador para cerrar los resultados
  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    // Cerrar los resultados de búsqueda si se hace clic fuera de ellos
    if (this.filteredUsers.length > 0) {
      const searchContainer = document.querySelector('.search-container');
      if (searchContainer && !searchContainer.contains(event.target as Node)) {
        this.clearSearch();
      }
    }
  }

  ngOnInit() {
    this.authService.isAuthenticated$.subscribe(isAuth => {
      this.isAuthenticated = isAuth;
      if (isAuth) {
        this.userExperienceService.getAuthenticatedUser().subscribe(user => {
          this.userFotoUrl = user.urlFoto;
        });
      } else {
        this.userFotoUrl = undefined;  // Limpiar foto cuando el usuario cierra sesión
      }
    });

    // Obtener todos los usuarios cuando la componente se inicializa
    this.userExperienceService.getAllUsers().subscribe(response => {
      this.userList = response.usuarios;
    });
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  logout(): void {
    this.authService.logout();
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

  // Navegar al perfil del usuario seleccionado
  navigateToUserProfile(userId: number) {
    this.router.navigate(['/perfil', userId]);
    this.clearSearch();
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
