export type NotificationType =
  | 'DONATION'
  | 'RECORD'
  | 'NEW_ALBUM'
  | 'FOLLOW'
  | 'LIKE_SONG'
  | 'LIKE_ALBUM';

export interface NotificationGet {
  id: number;
  receiver: number;
  message: string;
  slug: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string | number[]; // Puede ser un string ISO o un array de números [año, mes, día, hora, minuto, segundo, nanosegundos]
}
