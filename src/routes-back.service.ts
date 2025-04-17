import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RoutesBackService {
  // 👉 Cambiá este string según el entorno
  private readonly baseUrl: string = 'http://localhost';
  // private readonly baseUrl: string = 'https://soundtribe.art';

  get userServiceUrl(): string {
    return `${this.baseUrl}:8080`;
  }

  get musicServiceUrl(): string {
    return `${this.baseUrl}:8081`;
  }

  get commentServiceUrl(): string {
    return `${this.baseUrl}:8082`;
  }

  get commerceServiceUrl(): string {
    return `${this.baseUrl}:8083`;
  }

  get searchAnalyticsServiceUrl(): string {
    return `${this.baseUrl}:8084`;
  }

  get frontEndUrl(): string {
    return `${this.baseUrl}:4200`;
  }
}
