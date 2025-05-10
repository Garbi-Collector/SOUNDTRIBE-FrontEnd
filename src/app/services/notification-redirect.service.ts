import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationGet } from '../dtos/noti/NotificationsDto';

@Injectable({
  providedIn: 'root'
})
export class NotificationRedirectService {

  constructor(private router: Router) {}

  redirectBasedOnNotification(notification: NotificationGet): void {
    const typesThatGoToProfile = ['DONATION', 'RECORD', 'FOLLOW', 'LIKE_SONG'];

    if (typesThatGoToProfile.includes(notification.type)) {
      const redirectUrl = ['/perfil', notification.slug];
      console.log('Redirigiendo a:', redirectUrl);  // Muestra la URL a la que se redirige
      this.router.navigate(redirectUrl).then(success => {
        console.log('Redirección exitosa:', success);  // true si la navegación fue exitosa
      }).catch(err => {
        console.log('Error en redirección:', err);  // Si hubo algún error en la redirección
      });
    } else {
      const redirectUrl = ['/album', notification.slug];
      console.log('Redirigiendo a:', redirectUrl);  // Muestra la URL a la que se redirige
      this.router.navigate(redirectUrl).then(success => {
        console.log('Redirección exitosa:', success);  // true si la navegación fue exitosa
      }).catch(err => {
        console.log('Error en redirección:', err);  // Si hubo algún error en la redirección
      });
    }
  }

}
