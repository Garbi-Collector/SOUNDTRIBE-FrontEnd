import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RoutesBackService {
  // 👉 Cambiá este string según el entorno
  private readonly baseUrl: string = 'http://soundtribe.art';
  // private readonly baseUrl: string = 'http://soundtribe.art';

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
}
