import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BackEndRoutesService {

  private readonly baseUrl: string = 'http://soundtribe.art'
  //private readonly baseUrl: string = 'http://localhost'

  get userServiceUrl(): string{
    return `${this.baseUrl}:8080`;
  }
  get musicServiceUrl(): string{
    return `${this.baseUrl}:8081`;
  }
  get notificationServiceUrl(): string{
    return `${this.baseUrl}:8083`;
  }
  get searchAnalyticsServiceUrl(): string{
    return `${this.baseUrl}:8084`;
  }
}
