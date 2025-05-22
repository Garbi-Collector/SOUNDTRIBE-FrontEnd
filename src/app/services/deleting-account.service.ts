import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BackEndRoutesService } from '../back-end.routes.service';

@Injectable({
  providedIn: 'root'
})
export class DeletingAccountService {
  private apiUrl: string;

  constructor(
    private http: HttpClient,
    private backEndRoutes: BackEndRoutesService
  ) {
    this.apiUrl = this.backEndRoutes.userServiceUrl;
  }

  eliminarCuenta(token: string): Observable<string> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.delete(`${this.apiUrl}/eliminate/user/delete-account`, {
      headers,
      responseType: 'text'
    });
  }


}
