export class RoutesBack {
  private static baseUrl: string;

  // Se puede configurar la URL base según el entorno
  private static setBaseUrl(): void {
    if (window.location.hostname === 'localhost') {
      this.baseUrl = 'http://localhost'; // En desarrollo local
    } else {
      this.baseUrl = 'https://soundtribe.art'; // En producción o cualquier otro entorno
    }
  }

  // Llamar este méto-do una sola vez al inicio para configurar la URL base
  static initialize(): void {
    this.setBaseUrl();
  }

  // Obtener la URL de la API del User Service
  static get userServiceUrl(): string {
    return `${this.baseUrl}:8080`;
  }

  // Obtener la URL de la API del Music Service
  static get musicServiceUrl(): string {
    return `${this.baseUrl}:8081`;
  }

  // Obtener la URL de la API del Comment Service
  static get commentServiceUrl(): string {
    return `${this.baseUrl}:8082`;
  }

  // Obtener la URL de la API del Commerce Service
  static get commerceServiceUrl(): string {
    return `${this.baseUrl}:8083`;
  }

  // Obtener la URL de la API del Search & Analytics Service
  static get searchAnalyticsServiceUrl(): string {
    return `${this.baseUrl}:8084`;
  }

  // Obtener la URL de la página FrontEnd
  static get frontEndUrl(): string {
    return `${this.baseUrl}:4200`;
  }
}
