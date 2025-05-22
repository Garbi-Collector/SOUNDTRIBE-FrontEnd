import { Component } from '@angular/core';
import { ModalService } from "../../services/modal.service";
import { UserService } from "../../services/user.service";

@Component({
  selector: 'app-change-description',
  templateUrl: './change-description.component.html',
  styleUrls: ['./change-description.component.css']
})
export class ChangeDescriptionComponent {
  newDescription: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private modalService: ModalService,
    private userService: UserService
  ) {}

  /**
   * Cierra el modal
   */
  closeModal(): void {
    this.modalService.closeModal();
  }

  /**
   * Cambia la descripción del usuario
   */
  changeDescription(): void {
    // Validar que haya descripción
    if (!this.newDescription.trim()) {
      this.errorMessage = 'Por favor, ingresa una descripción válida';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.userService.changeDescription(this.newDescription.trim()).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = 'Descripción actualizada correctamente';

        // Cerrar el modal después de 1.5 segundos
        setTimeout(() => {
          this.closeModal();
        }, 1500);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Error al actualizar la descripción';
        console.error('Error changing description:', error);
      }
    });
  }

  /**
   * Maneja el evento de presionar Enter en el textarea
   */
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && event.ctrlKey) {
      this.changeDescription();
    }
  }

  /**
   * Limpia los mensajes de error y éxito
   */
  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}
