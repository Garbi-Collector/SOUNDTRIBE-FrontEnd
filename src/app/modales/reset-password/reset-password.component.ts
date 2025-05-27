import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalService } from "../../services/modal.service";
import { UserService } from "../../services/user.service";

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent {
  resetForm: FormGroup;
  isLoading = false;
  showSuccessMessage = false;
  errorMessage = '';

  constructor(
    private modalService: ModalService,
    private userService: UserService,
    private fb: FormBuilder
  ) {
    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  // Métodos del modal
  closeModal(): void {
    this.modalService.closeModal();
  }

  // Enviar solicitud de recuperación
  onSubmit(): void {
    if (this.resetForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const email = this.resetForm.get('email')?.value;

      this.userService.recuperarPassword(email).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.showSuccessMessage = true;
          this.resetForm.reset();
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = 'Error al enviar la solicitud. Por favor, inténtelo de nuevo.';
          console.error('Error en recuperación de contraseña:', error);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  // Marcar todos los campos como tocados para mostrar errores
  private markFormGroupTouched(): void {
    Object.keys(this.resetForm.controls).forEach(key => {
      const control = this.resetForm.get(key);
      control?.markAsTouched();
    });
  }

  // Getter para facilitar el acceso a los controles del formulario
  get email() {
    return this.resetForm.get('email');
  }

  // Verificar si hay errores en el campo email
  get emailHasError(): boolean {
    return this.email?.invalid && (this.email?.dirty || this.email?.touched) || false;
  }

  // Obtener mensaje de error específico para email
  get emailErrorMessage(): string {
    if (this.email?.hasError('required')) {
      return 'El email es obligatorio';
    }
    if (this.email?.hasError('email')) {
      return 'El formato del email no es válido';
    }
    return '';
  }

  // Resetear el estado de éxito
  resetSuccessState(): void {
    this.showSuccessMessage = false;
  }
}
