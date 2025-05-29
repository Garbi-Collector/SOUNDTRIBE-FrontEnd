import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DeletingAccountService } from '../../services/deleting-account.service';

@Component({
  selector: 'app-eliminar-cuenta',
  templateUrl: './eliminar-cuenta.component.html',
  styleUrls: ['./eliminar-cuenta.component.css']
})
export class EliminarCuentaComponent implements OnInit {

  // Control del stepper
  currentStep: number = 1;

  // Paso 1
  termsAccepted: boolean = false;

  // Paso 2
  confirmationText: string = '';
  expectedText: string = '';
  username: string = '';

  // Estados
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private deletingAccountService: DeletingAccountService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Obtener el nombre de usuario del localStorage
    this.username = this.authService.getCurrentUsername() || '';
    this.expectedText = `yo ${this.username}, quiero eliminar mi cuenta de SOUNDTRIBE`;
  }

  // Navegar al siguiente paso
  nextStep(): void {
    if (this.currentStep === 1 && this.termsAccepted) {
      this.currentStep = 2;
      this.errorMessage = '';
    }
  }

  // Volver al paso anterior
  previousStep(): void {
    if (this.currentStep === 2) {
      this.currentStep = 1;
      this.confirmationText = '';
      this.errorMessage = '';
    }
  }

  // Verificar si el texto de confirmación es correcto
  isConfirmationTextValid(): boolean {
    return this.confirmationText.trim() === this.expectedText.trim();
  }

  // Eliminar cuenta
  deleteAccount(): void {
    if (!this.isConfirmationTextValid()) {
      this.errorMessage = 'El texto de confirmación no coincide. Por favor, escríbelo exactamente como se muestra.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const token = this.authService.getToken();
    if (!token) {
      this.errorMessage = 'No se encontró el token de autenticación.';
      this.isLoading = false;
      return;
    }

    this.deletingAccountService.eliminarCuenta(token).subscribe({
      next: (response) => {

        // Cerrar sesión y limpiar datos
        this.authService.logout();

        // Redirigir al inicio con un mensaje de confirmación
        alert('Tu cuenta ha sido eliminada exitosamente. Lamentamos verte partir.');
        this.router.navigate(['/inicio']);
      },
      error: (error) => {
        console.error('Error al eliminar cuenta:', error);
        this.errorMessage = 'Hubo un error al eliminar tu cuenta. Por favor, inténtalo de nuevo o contacta al soporte.';
        this.isLoading = false;
      }
    });
  }

  // Abrir cliente de correo para contactar soporte
  contactSupport(): void {
    const email = 'soundtribe.art@gmail.com';
    const subject = 'Consulta sobre eliminación de cuenta';
    const body = 'Hola, tengo una consulta sobre la eliminación de mi cuenta en SOUNDTRIBE.';

    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
  }

  // Cancelar proceso y volver al perfil
  cancelProcess(): void {
    this.router.navigate(['/inicio']);
  }
}
