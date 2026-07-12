export interface Location {
  id: number;
  uid: string;
  name: string;
  description?: string;
  parentId?: number;
  type: 'HALL' | 'BOOKSHELF' | 'SHELF';
  librarianUserId?: number;
}
