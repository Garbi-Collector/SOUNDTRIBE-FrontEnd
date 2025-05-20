import { Component } from '@angular/core';
import {ModalService} from "../../services/modal.service";

@Component({
  selector: 'app-terminos-condiciones-app',
  templateUrl: './terminos-condiciones-app.component.html',
  styleUrls: ['./terminos-condiciones-app.component.css']
})
export class TerminosCondicionesAppComponent {
  copied = false;
  private email = 'soundtribe.art@gmail.com';

  constructor(private modalService: ModalService) {}

  closeModal(): void {
    this.modalService.closeModal();
  }

  copyEmail(): void {
    const email = 'soundtribe.art@gmail.com';
    const textarea = document.createElement('textarea');
    textarea.value = email;
    document.body.appendChild(textarea);
    textarea.select();

    try {
      const successful = document.execCommand('copy');
      this.copied = successful;
    } catch (err) {
      alert('No se pudo copiar el correo, por favor cópielo manualmente.');
    }

    document.body.removeChild(textarea);

    if (this.copied) {
      setTimeout(() => this.copied = false, 3000);
    }
  }

}
