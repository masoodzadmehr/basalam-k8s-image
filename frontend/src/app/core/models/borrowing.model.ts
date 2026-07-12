export interface Borrowing {
  id: number;
  uid: string;
  userId: number;
  username: string;
  bookId: number;
  bookTitle: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'BORROWED' | 'RETURNED' | 'OVERDUE' | 'EXTENDED';
  extensionCount: number;
}
