// change-password.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ModalService } from '../../services/modal.service';
import { ChangePasswordRequestDto } from '../../dtos/usuarios/auth.dto';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent implements OnInit {
  changePasswordForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private modalService: ModalService
  ) {
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
  }

  passwordMatchValidator(g: FormGroup) {
    const newPassword = g.get('newPassword')?.value;
    const confirmPassword = g.get('confirmPassword')?.value;

    return newPassword === confirmPassword ? null : { 'mismatch': true };
  }

  togglePasswordVisibility(field: 'current' | 'new' | 'confirm'): void {
    if (field === 'current') {
      this.showCurrentPassword = !this.showCurrentPassword;
    } else if (field === 'new') {
      this.showNewPassword = !this.showNewPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  onSubmit(): void {
    if (this.changePasswordForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const currentPassword = this.changePasswordForm.value.currentPassword;
    const newPassword = this.changePasswordForm.value.newPassword;

    this.authService.verifyPassword(currentPassword).subscribe({
      next: (isPasswordCorrect) => {
        if (!isPasswordCorrect) {
          this.isSubmitting = false;
          this.errorMessage = 'La contraseña actual es incorrecta';
          return;
        }

        const changePasswordData: ChangePasswordRequestDto = {
          currentPassword,
          newPassword
        };

        this.authService.changePassword(changePasswordData).subscribe({
          next: (response) => {
            this.isSubmitting = false;
            this.successMessage = 'Contraseña actualizada correctamente';
            this.changePasswordForm.reset();

            setTimeout(() => {
              this.closeModal();
            }, 2000);
          },
          error: (error) => {
            this.isSubmitting = false;
            this.errorMessage = error.message || 'Ha ocurrido un error al cambiar la contraseña';
          }
        });
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error.message || 'Error al verificar la contraseña actual';
      }
    });
  }

  closeModal(): void {
    this.modalService.closeModal();
  }
}
