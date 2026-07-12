export interface Fine {
  id: number;
  uid: string;
  borrowingId: number;
  userId: number;
  username: string;
  bookTitle: string;
  amount: number;
  dailyRate: number;
  daysOverdue: number;
  paid: boolean;
  paidDate?: string;
  createdDate: string;
}
