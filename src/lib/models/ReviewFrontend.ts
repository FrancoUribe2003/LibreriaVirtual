export interface ReviewFrontend {
  _id: string;
  bookId: string;
  userId: string;
  content: string;
  rating: number;
  userName?: string;
  bookTitle?: string;
}