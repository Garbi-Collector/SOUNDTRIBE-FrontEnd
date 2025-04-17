import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginRequestDto } from '../../../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-auth-inicio',
  templateUrl: './auth-inicio.component.html',
  styleUrls: ['./auth-inicio.component.css']
})
export class AuthInicioComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  errorMessage = '';
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Si el usuario ya está autenticado, redirigir al inicio
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/inicio']);
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const loginData: LoginRequestDto = {
      email: this.loginForm.get('email')?.value,
      password: this.loginForm.get('password')?.value
    };


    console.log('Enviando solicitud de login:', {
      url: 'http://localhost:8080/auth/login',
      data: { ...loginData, password: '********' } // No mostrar la contraseña real en la consola
    });

    this.authService.login(loginData)
      .subscribe({
        next: (response) => {
          this.loading = false;
          console.log('Login exitoso:', response);
          this.router.navigate(['/inicio']);
        },
        error: (error: HttpErrorResponse) => {
          this.loading = false;
          console.error('Error de login:', error);

          // Manejar diferentes códigos de error HTTP
          if (error.status === 403) {
            this.errorMessage = 'Acceso denegado. Verifica que tu cuenta esté habilitada y que las credenciales sean correctas.';
          } else if (error.status === 401) {
            this.errorMessage = 'Credenciales incorrectas. Por favor, verifica tu email y contraseña.';
          } else if (error.status === 0) {
            this.errorMessage = 'No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet.';
          } else {
            // Intentar extraer mensaje de error del backend si existe
            this.errorMessage = error.error && typeof error.error === 'string'
              ? error.error
              : 'Ha ocurrido un error al iniciar sesión. Por favor, inténtalo de nuevo más tarde.';
          }
        }
      });
  }
}
