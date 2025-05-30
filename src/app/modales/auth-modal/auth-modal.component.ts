import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { debounceTime, switchMap, of, catchError } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ModalService, ModalType } from '../../services/modal.service';
import { ImageProcessingService } from '../../services/image-processing.service'; // Importar el servicio
import { HttpErrorResponse } from '@angular/common/http';
import { RegisterRequestDto, LoginRequestDto } from '../../dtos/usuarios/auth.dto';
import { passwordComplexityValidator } from "../../validators/passwordComplexityValidator";

@Component({
  selector: 'app-auth-modal',
  templateUrl: './auth-modal.component.html',
  styleUrls: ['./auth-modal.component.css']
})
export class AuthModalComponent implements OnInit {

  sacarUrl(): string {
    const urlActual = this.router.url;
    return urlActual;
  }

  // Métodos del modal
  closeModal(): void {
    const urlActual = this.sacarUrl();

    if (urlActual === '/auth') {
      // Si estamos en /auth, redirige a /inicio
      this.router.navigate(['/inicio']);
    }

    this.modalService.closeModal();
  }

  // Control de pestañas
  activeTab: 'login' | 'register' = 'login';

  // Formulario de Login
  loginForm: FormGroup;
  loginLoading = false;
  loginErrorMessage = '';
  hideLoginPassword = true;

  // Formulario de Registro
  registerForm: FormGroup;
  registerLoading = false;
  registerErrorMessage = '';
  registerSuccessMessage = '';
  hideRegisterPassword = true;
  hideConfirmPassword = true;
  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;

  // Nuevas propiedades para el procesamiento de imágenes
  imageProcessing = false;
  imageProcessingMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private modalService: ModalService,
    private imageProcessingService: ImageProcessingService // Inyectar el servicio
  ) {
    // Inicializar formulario de login
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });

    // Inicializar formulario de registro
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [
          Validators.required,
          passwordComplexityValidator
        ]
      ],
      confirmPassword: ['', Validators.required],
      rol: ['OYENTE', Validators.required],
      termsAccepted: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Detectar si el usuario ya está autenticado
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/inicio']);
      this.closeModal();
    }

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

  // Métodos de navegación entre pestañas
  setActiveTab(tab: 'login' | 'register'): void {
    this.activeTab = tab;
    // Limpiar mensajes de error al cambiar de pestaña
    this.loginErrorMessage = '';
    this.registerErrorMessage = '';
    this.registerSuccessMessage = '';
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

  // Métodos del formulario de login
  onLoginSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.loginLoading = true;
    this.loginErrorMessage = '';

    const loginData: LoginRequestDto = {
      email: this.loginForm.get('email')?.value,
      password: this.loginForm.get('password')?.value
    };

    this.authService.login(loginData)
      .subscribe({
        next: (response) => {
          this.loginLoading = false;
          this.closeModal();
          this.router.navigate(['/inicio']);
        },
        error: (error: HttpErrorResponse) => {
          this.loginLoading = false;

          // Manejar diferentes códigos de error HTTP
          if (error.status === 403) {
            this.loginErrorMessage = 'Acceso denegado. Verifica que tu cuenta esté habilitada y que las credenciales sean correctas.';
          } else if (error.status === 401) {
            this.loginErrorMessage = 'Credenciales incorrectas. Por favor, verifica tu email y contraseña.';
          } else if (error.status === 0) {
            this.loginErrorMessage = 'No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet.';
          } else {
            // Intentar extraer mensaje de error del backend si existe
            this.loginErrorMessage = error.error && typeof error.error === 'string'
              ? error.error
              : 'Ha ocurrido un error al iniciar sesión. Por favor, inténtalo de nuevo más tarde.';
          }
        }
      });
  }

  // Métodos del formulario de registro - MÉTODO ACTUALIZADO
  async onFileSelected(event: Event): Promise<void> {
    const element = event.target as HTMLInputElement;
    if (element.files && element.files.length > 0) {
      const originalFile = element.files[0];

      // Validar que sea una imagen
      if (!originalFile.type.startsWith('image/')) {
        this.registerErrorMessage = 'Por favor, selecciona un archivo de imagen válido.';
        return;
      }

      // Validar tamaño máximo (por ejemplo, 5MB)
      const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
      if (originalFile.size > maxSizeInBytes) {
        this.registerErrorMessage = 'La imagen es demasiado grande. El tamaño máximo permitido es 5MB.';
        return;
      }

      try {
        this.imageProcessing = true;
        this.imageProcessingMessage = 'Procesando imagen...';
        this.registerErrorMessage = '';

        let processedFile = originalFile;

        // Solo procesar si no es PNG o si no es cuadrada
        if (originalFile.type !== 'image/png') {
          this.imageProcessingMessage = 'Convirtiendo imagen a PNG...';
          processedFile = await this.imageProcessingService.convertToPng(originalFile);
        }

        // Verificar si la imagen es cuadrada
        const isSquare = await this.checkIfImageIsSquare(processedFile);
        if (!isSquare) {
          this.imageProcessingMessage = 'Recortando imagen a formato cuadrado...';
          processedFile = await this.imageProcessingService.cropToSquare(processedFile);
        }

        this.selectedFile = processedFile;

        // Crear preview de la imagen procesada
        const reader = new FileReader();
        reader.onload = () => {
          this.previewUrl = reader.result;
        };
        reader.readAsDataURL(this.selectedFile);

        this.imageProcessingMessage = 'Imagen procesada correctamente';

        // Limpiar el mensaje después de 2 segundos
        setTimeout(() => {
          this.imageProcessingMessage = '';
        }, 2000);

      } catch (error) {
        console.error('Error al procesar la imagen:', error);
        this.registerErrorMessage = 'Error al procesar la imagen. Por favor, intenta con otra imagen.';
      } finally {
        this.imageProcessing = false;
      }
    }
  }

  // Método auxiliar para verificar si una imagen es cuadrada
  private async checkIfImageIsSquare(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve(img.width === img.height);
      };
      img.onerror = () => resolve(false);
      img.src = URL.createObjectURL(file);
    });
  }

  removeFile(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    this.imageProcessingMessage = '';
    this.registerErrorMessage = '';
  }

  onRegisterSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    this.registerLoading = true;
    this.registerErrorMessage = '';
    this.registerSuccessMessage = '';

    const registerData: RegisterRequestDto = {
      username: this.registerForm.value.username,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
      rol: this.registerForm.value.rol
    };

    this.authService.signUp(registerData, this.selectedFile || undefined)
      .subscribe({
        next: (response) => {
          this.registerLoading = false;
          this.registerSuccessMessage = response;
          this.registerForm.reset({
            rol: 'OYENTE' // Restablecer el valor predeterminado del rol
          });
          this.selectedFile = null;
          this.previewUrl = null;
          this.imageProcessingMessage = '';
        },
        error: (error) => {
          this.registerLoading = false;
          if (error.error && typeof error.error === 'string') {
            this.registerErrorMessage = error.error;
          } else {
            this.registerErrorMessage = 'Error al registrar el usuario. Por favor, inténtelo de nuevo.';
          }
        }
      });
  }

  openTermsModal(): void {
    this.modalService.openModal(ModalType.TermsAndConditions);
  }

  openResetPasswordModal(): void {
    this.modalService.openModal(ModalType.ResetPassword);
  }
}
