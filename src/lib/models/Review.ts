import mongoose, { Schema, Document, model } from "mongoose";

export interface IReview extends Document {
  bookId: string; // id del libro (de Google Books)
  userId: mongoose.Types.ObjectId; // referencia al usuario
  content: string;
  rating: number; // 1 a 5
  votes: number; // suma de votos positivos-negativos
  createdAt: Date;
}

const reviewSchema = new Schema<IReview>({
  bookId: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  votes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Review || model<IReview>("Review", reviewSchema);
