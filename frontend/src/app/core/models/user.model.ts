export interface User {
  id: number;
  uid: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  mobile?: string;
  role: 'USER' | 'LIBRARIAN' | 'ADMIN';
  enabled: boolean;
}
