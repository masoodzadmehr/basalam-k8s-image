export interface Reservation {
  id: number;
  uid: string;
  userId: number;
  username: string;
  bookId: number;
  bookTitle: string;
  reserveDate: string;
  expiryDate: string;
  fulfilledDate?: string;
  status: 'PENDING' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED';
}
