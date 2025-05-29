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

      this.router.navigate(redirectUrl).then(success => {

      }).catch(err => {

      });
    } else {
      const redirectUrl = ['/album', notification.slug];

      this.router.navigate(redirectUrl).then(success => {

      }).catch(err => {

      });
    }
  }

}
