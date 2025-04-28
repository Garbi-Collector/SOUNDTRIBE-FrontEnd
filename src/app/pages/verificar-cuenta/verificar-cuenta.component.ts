import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {ActivateAcountService} from "../../services/activate-acount.service";

@Component({
  selector: 'app-verificar-cuenta',
  templateUrl: './verificar-cuenta.component.html',
  styleUrls: ['./verificar-cuenta.component.css']
})
export class VerificarCuentaComponent implements OnInit {
  mensaje: string = '';
  estado: 'cargando' | 'exito' | 'error' = 'cargando';

  constructor(private route: ActivatedRoute, private activateAcountService: ActivateAcountService) {}

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token');
    if (token) {
      this.activateAcountService.verificarCuenta(token).subscribe({
        next: (msg) => {
          this.mensaje = msg;
          this.estado = 'exito';
        },
        error: (err) => {
          this.mensaje = err.error || 'Error al verificar la cuenta.';
          this.estado = 'error';
        }
      });
    } else {
      this.estado = 'error';
      this.mensaje = 'Token no válido';
    }
  }
}
