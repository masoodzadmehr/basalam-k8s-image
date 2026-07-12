export interface Book {
  id: number;
  uid: string;
  title: string;
  author: string;
  isbn: string;
  publisher?: string;
  publicationYear?: number;
  copiesCount: number;
  availableCopies: number;
  shelfId: number;
}
