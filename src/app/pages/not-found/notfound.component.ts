import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-not-found',
  templateUrl: './notfound.component.html',
  styleUrls: ['./notfound.component.css']
})
export class NotfoundComponent {
  private secretSequence: string[] = [];

  constructor(private router: Router) {}

  activateSecret(digit: string): void {
    this.secretSequence.push(digit);

    // Verificar la secuencia 4-0-4
    if (this.secretSequence.length === 3) {
      if (this.secretSequence[0] === '4' &&
        this.secretSequence[1] === '0' &&
        this.secretSequence[2] === '4') {
        // Redireccionar al destino secreto
        this.router.navigate(['/secret-page']);
      }
      // Reiniciar la secuencia en cualquier caso
      this.secretSequence = [];
    }
  }
}
