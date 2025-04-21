import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FechasService {

  constructor() { }

  /**
   * Recibe una fecha en formato ISO (ej: "2024-04-20T18:30:00")
   * y devuelve un string con formato dd/mm/aaaa
   */
  formatearFechaDDMMAAAA(fechaIso: string): string {
    if (!fechaIso) return '';

    // Asegura que sea compatible con el constructor de Date
    const fechaValida = fechaIso.includes('T') ? `${fechaIso}` : `${fechaIso}T00:00:00`;
    const date = new Date(fechaValida);

    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Mes empieza desde 0
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }



  formatearFechaDiaDeMesYAnio(isoDateString: string): string {
    const fecha = new Date(isoDateString);
    const opciones: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    };

    return fecha.toLocaleDateString('es-AR', opciones); // Ej: "20 de abril de 2025"
  }
}
