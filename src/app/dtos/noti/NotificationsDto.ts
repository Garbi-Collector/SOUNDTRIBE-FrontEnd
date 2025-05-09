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
}
