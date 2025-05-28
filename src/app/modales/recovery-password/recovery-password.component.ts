import { Component, OnInit } from '@angular/core';
import { ModalService } from "../../services/modal.service";
import { Router, ActivatedRoute } from "@angular/router";
import { UserService } from "../../services/user.service";
import { PasswordChangeRequest } from "../../dtos/usuarios/users.dto";

@Component({
  selector: 'app-recovery-password',
  templateUrl: './recovery-password.component.html',
  styleUrls: ['./recovery-password.component.css']
})
export class RecoveryPasswordComponent implements OnInit {
  slugRecovery: string = '';
  username: string = '';
  isValidSlug: boolean = false;
  isLoading: boolean = false;
  isProcessing: boolean = false;

  // Form fields
  usernameInput: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  // Validation states
  isUsernameValid: boolean = false;
  canEditPasswords: boolean = false;

  // Error messages
  errorMessage: string = '';
  usernameError: string = '';
  passwordError: string = '';
  confirmPasswordError: string = '';

  // Success state
  isSuccess: boolean = false;
  successMessage: string = '';

  constructor(
    private modalService: ModalService,
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.slugRecovery = params['slugRecovery'];
      if (this.slugRecovery) {
        this.validateSlug();
      } else {
        this.errorMessage = 'No se encontró el código de recuperación en la URL';
      }
    });
  }

  private validateSlug(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.userService.isSlugRecoveryValid(this.slugRecovery).subscribe({
      next: (isValid) => {
        if (isValid) {
          this.loadUserData();
        } else {
          this.errorMessage = 'La petición de cambio de contraseña no existe o expiró';
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error validando slug:', error);
        this.errorMessage = 'La petición de cambio de contraseña no existe o expiró';
        this.isLoading = false;
      }
    });
  }

  private loadUserData(): void {
    this.userService.validarSlugRecovery(this.slugRecovery).subscribe({
      next: (username) => {
        this.username = username;
        this.isValidSlug = true;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cargando datos del usuario:', error);
        this.errorMessage = 'Error al cargar los datos del usuario';
        this.isLoading = false;
      }
    });
  }

  onUsernameChange(): void {
    this.usernameError = '';
    this.canEditPasswords = false;

    if (!this.usernameInput.trim()) {
      this.usernameError = 'El campo username debe rellenarse';
      this.isUsernameValid = false;
      return;
    }

    if (this.username && this.usernameInput.trim() === this.username) {
      this.isUsernameValid = true;
      this.canEditPasswords = true;
      this.usernameError = '';
    } else {
      this.usernameError = 'El username no es correcto';
      this.isUsernameValid = false;
    }
  }

  onPasswordChange(): void {
    this.passwordError = '';

    if (!this.newPassword) {
      return;
    }

    if (this.newPassword.length < 8) {
      this.passwordError = 'La contraseña debe tener al menos 8 caracteres';
      return;
    }

    const hasUpperCase = /[A-Z]/.test(this.newPassword);
    const hasLowerCase = /[a-z]/.test(this.newPassword);
    const hasNumbers = /\d/.test(this.newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(this.newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      this.passwordError = 'La contraseña debe contener mayúsculas, minúsculas, números y caracteres especiales';
      return;
    }

    // Re-validate confirm password if it exists
    if (this.confirmPassword) {
      this.onConfirmPasswordChange();
    }
  }

  onConfirmPasswordChange(): void {
    this.confirmPasswordError = '';

    if (!this.confirmPassword) {
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.confirmPasswordError = 'Las contraseñas no coinciden';
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  isFormValid(): boolean {
    return this.isUsernameValid &&
      this.canEditPasswords &&
      this.newPassword.length >= 8 &&
      this.newPassword === this.confirmPassword &&
      !this.passwordError &&
      !this.confirmPasswordError;
  }

  onSubmit(): void {
    if (!this.isFormValid()) {
      return;
    }

    this.isProcessing = true;
    this.errorMessage = '';

    const request: PasswordChangeRequest = {
      newPassword: this.newPassword,
      slugRecovery: this.slugRecovery
    };

    this.userService.cambiarPassword(request).subscribe({
      next: (response) => {
        this.isSuccess = true;
        this.successMessage = 'Contraseña cambiada exitosamente';
        this.isProcessing = false;

        // Redirect after 3 seconds
        setTimeout(() => {
          this.closeModalToAuth();
        }, 3000);
      },
      error: (error) => {
        console.error('Error cambiando contraseña:', error);
        this.errorMessage = 'Error al cambiar la contraseña. Por favor, intenta nuevamente.';
        this.isProcessing = false;
      }
    });
  }

  closeModalToAuth(): void {
    this.modalService.closeModal();
    this.router.navigate(['/auth']);
  }

  closeModal(): void {
    this.modalService.closeModal();
    this.router.navigate(['/inicio']);
  }
}
