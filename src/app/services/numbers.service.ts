import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NumbersService {

  constructor() { }

  shortenNumber(value: number): string {
    if (value < 1000) return value.toString();

    const units = ['k', 'M', 'B', 'T']; // miles, millones, billones, trillones
    const divisor = 1000;
    let unitIndex = -1;
    let reduced = value;

    while (reduced >= divisor && unitIndex < units.length - 1) {
      reduced /= divisor;
      unitIndex++;
    }

    // Mostrar un decimal si es necesario (ej: 1.5M)
    const hasDecimal = reduced < 100 && reduced % 1 !== 0;
    const formatted = hasDecimal ? reduced.toFixed(1) : Math.floor(reduced).toString();

    return `${formatted}${units[unitIndex]}`;
  }
}
