import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationGet, NotificationType } from '../../dtos/noti/NotificationsDto';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { forkJoin } from "rxjs";

@Component({
  selector: 'app-notification-modal',
  templateUrl: './notification-modal.component.html',
  styleUrls: ['./notification-modal.component.css']
})
export class NotificationModalComponent implements OnInit {
  notifications: NotificationGet[] = [];
  isOpen = false;
  unreadCount = 0;

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Suscribirse al estado de autenticación
    this.authService.isAuthenticated$.subscribe(isAuth => {
      if (isAuth) {
        this.loadNotifications();
      } else {
        this.notifications = [];
        this.unreadCount = 0;
      }
    });
  }

  loadNotifications(): void {
    const token = this.authService.getToken();
    if (token) {
      this.notificationService.getMyNotifications(token).subscribe(
        (notifications) => {
          this.notifications = notifications;
          this.calculateUnreadCount();
        },
        (error) => {
          console.error('Error al cargar notificaciones:', error);
        }
      );
    }
  }

  toggleNotifications(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.isOpen = !this.isOpen;

    // Si abrimos el modal, actualizamos las notificaciones
    if (this.isOpen) {
      this.loadNotifications();
    }
  }

  onNotificationClick(notification: NotificationGet): void {
    const token = this.authService.getToken();
    if (!notification.isRead && token) {
      this.notificationService.markAsRead(notification.id, token).subscribe(() => {
        notification.isRead = true;
        this.calculateUnreadCount();
      });
    }


    this.redirectBasedOnNotification(notification);

    // Cerramos el modal después de hacer clic
    this.isOpen = false;
  }

  redirectBasedOnNotification(notification: NotificationGet): void {
    if (!notification.slug) {
      console.error('Slug de notificación no disponible');
      return;
    }

    const typesThatGoToProfile = ['DONATION', 'RECORD', 'FOLLOW', 'LIKE_SONG'];

    try {
      if (typesThatGoToProfile.includes(notification.type)) {
        this.router.navigate(['/perfil', notification.slug]);
      } else {
        this.router.navigate(['/album', notification.slug]);
      }
    } catch (error) {
      console.error('Error en la redirección:', error);
    }
  }

  getIconForNotificationType(type: NotificationType): string {
    const iconMap: Record<NotificationType, string> = {
      'DONATION': 'bi-cash',
      'RECORD': 'bi-music-note',
      'NEW_ALBUM': 'bi-disc',
      'FOLLOW': 'bi-person-plus',
      'LIKE_SONG': 'bi-heart',
      'LIKE_ALBUM': 'bi-heart-fill'
    };

    return iconMap[type] || 'bi-bell';
  }

  getTimeAgo(notification: NotificationGet): string {
    if (!notification.createdAt) {
      return 'fecha desconocida';
    }

    // Convertir el array de fecha a un objeto Date
    let createdDate: Date;

    // Verificar si createdAt es un array (formato Java LocalDateTime)
    if (Array.isArray(notification.createdAt)) {
      // El formato es [año, mes, día, hora, minuto, segundo, nanosegundos]
      const dateArray = notification.createdAt as unknown as number[];
      // Nota: los meses en JavaScript son base 0 (0-11), por lo que restamos 1 al mes
      createdDate = new Date(
        dateArray[0],         // año
        dateArray[1] - 1,     // mes (JavaScript usa 0-11)
        dateArray[2],         // día
        dateArray[3],         // hora
        dateArray[4],         // minuto
        dateArray[5],         // segundo
        dateArray[6] / 1000000 // convertir nanosegundos a milisegundos
      );
    } else {
      // Intentar parsear como string ISO
      createdDate = new Date(notification.createdAt);
    }

    const now = new Date();

    // Verificar si la fecha es válida
    if (isNaN(createdDate.getTime())) {
      console.error('Fecha inválida:', notification.createdAt);
      return 'fecha desconocida';
    }

    // Diferencia en milisegundos
    const diffMs = now.getTime() - createdDate.getTime();

    // Conversiones a diferentes unidades de tiempo
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    const diffYears = Math.floor(diffDays / 365);

    // Aplicar formato según el tiempo transcurrido
    if (diffYears > 0) {
      return `hace ${diffYears} ${diffYears === 1 ? 'año' : 'años'}`;
    } else if (diffWeeks > 0) {
      return `hace ${diffWeeks} sem`;
    } else if (diffDays > 0) {
      return `hace ${diffDays} días`;
    } else if (diffHours > 0) {
      return `hace ${diffHours} h`;
    } else if (diffMinutes > 0) {
      return `hace ${diffMinutes} min`;
    } else {
      return 'ahora mismo';
    }
  }

  calculateUnreadCount(): number {
    this.unreadCount = this.notifications.filter(n => !n.isRead).length;
    return this.unreadCount;
  }

  markAllAsRead(): void {
    const token = this.authService.getToken();
    if (!token) return;

    const unreadNotifications = this.notifications.filter(n => !n.isRead);
    if (unreadNotifications.length === 0) return;

    const requests = unreadNotifications.map(n =>
      this.notificationService.markAsRead(n.id, token)
    );

    forkJoin(requests).subscribe({
      next: () => {
        this.loadNotifications();
      },
      error: err => console.error('Error al marcar como leídas', err)
    });
  }

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent): void {
    // Cerrar el dropdown cuando se hace clic afuera
    const notificationElement = document.querySelector('.notification-icon');
    if (this.isOpen && notificationElement && !notificationElement.contains(event.target as Node)) {
      this.isOpen = false;
    }
  }
}
