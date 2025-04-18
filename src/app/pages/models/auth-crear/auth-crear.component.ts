// auth-crear.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, switchMap, of, catchError } from 'rxjs';
import { AuthService, RegisterRequestDto } from '../../../services/auth.service';

@Component({
  selector: 'app-auth-crear',
  templateUrl: './auth-crear.component.html',
  styleUrls: ['./auth-crear.component.css']
})
export class AuthCrearComponent implements OnInit {
  registerForm: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';
  hidePassword = true;
  hideConfirmPassword = true;
  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      rol: ['OYENTE', Validators.required] // Por defecto 'OYENTE'
    }, { validators: this.passwordMatchValidator });

    // Verificar si el username ya existe
    this.registerForm.get('username')?.valueChanges
      .pipe(
        debounceTime(500),
        switchMap(username => {
          if (username && this.registerForm.get('username')?.valid) {
            return this.authService.checkUsernameExists(username)
              .pipe(catchError(() => of(false)));
          }
          return of(false);
        })
      )
      .subscribe(exists => {
        if (exists) {
          this.registerForm.get('username')?.setErrors({ usernameExists: true });
        }
      });

    // Verificar si el email ya existe
    this.registerForm.get('email')?.valueChanges
      .pipe(
        debounceTime(500),
        switchMap(email => {
          if (email && this.registerForm.get('email')?.valid) {
            return this.authService.checkEmailExists(email)
              .pipe(
                catchError(() => of(false))
              );
          }
          return of(false);
        })
      )
      .subscribe(exists => {
        if (exists) {
          this.registerForm.get('email')?.setErrors({ emailExists: true });
        }
      });
  }

  ngOnInit(): void {
    // Si el usuario ya está autenticado, redirigir al inicio
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/inicio']);
    }
  }

  // Validador personalizado para comprobar que las contraseñas coinciden
  passwordMatchValidator(control: AbstractControl): { passwordMismatch: boolean } | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      control.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      return null;
    }
  }

  onFileSelected(event: Event): void {
    const element = event.target as HTMLInputElement;
    if (element.files && element.files.length > 0) {
      this.selectedFile = element.files[0];

      // Crear preview de la imagen
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const registerData: RegisterRequestDto = {
      username: this.registerForm.value.username,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
      rol: this.registerForm.value.rol
    };

    this.authService.signup(registerData, this.selectedFile || undefined)
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.successMessage = response;
          this.registerForm.reset({
            rol: 'OYENTE' // Restablecer el valor predeterminado del rol
          });
          this.selectedFile = null;
          this.previewUrl = null;
          // No redirigimos automáticamente, ya que el usuario debe verificar su email
        },
        error: (error) => {
          this.loading = false;
          if (error.error && typeof error.error === 'string') {
            this.errorMessage = error.error;
          } else {
            this.errorMessage = 'Error al registrar el usuario. Por favor, inténtelo de nuevo.';
          }
        }
      });
  }

  removeFile(): void {
    this.selectedFile = null;
    this.previewUrl = null;
  }
}
