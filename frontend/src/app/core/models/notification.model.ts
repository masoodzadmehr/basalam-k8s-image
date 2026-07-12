export interface Notification {
  id: number;
  uid: string;
  userId: number;
  message: string;
  type: 'OVERDUE' | 'RESERVATION_READY' | 'RESERVATION_EXPIRED' | 'GENERAL';
  isRead: boolean;
  createdDate: string;
}
