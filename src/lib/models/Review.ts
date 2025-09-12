import mongoose, { Schema, Document, model } from "mongoose";

export interface IReview extends Document {
  bookId: string; 
  userId: mongoose.Types.ObjectId; 
  content: string;
  rating: number; 
  votes: number; 
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
