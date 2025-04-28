import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {BackEndRoutesService} from "../back-end.routes.service";

@Injectable({
  providedIn: 'root'
})
export class ActivateAcountService {
  private apiUrl: string;

  constructor(
    private http: HttpClient,
    private backEndRoutes: BackEndRoutesService
  ) {
    this.apiUrl = this.backEndRoutes.userServiceUrl;
  }


  verificarCuenta(token: string): Observable<string> {
    return this.http.get(`${this.apiUrl}/auth/accountVerification/${token}`, { responseType: 'text' });
  }
}
