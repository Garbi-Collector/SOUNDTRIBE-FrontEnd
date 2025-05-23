import { Component } from '@angular/core';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-terminos-donacion',
  templateUrl: './terminos-donacion.component.html',
  styleUrls: ['./terminos-donacion.component.css']
})
export class TerminosDonacionComponent {
  constructor(private modalService: ModalService) {}

  closeModal(): void {
    this.modalService.closeModal();
  }
}
