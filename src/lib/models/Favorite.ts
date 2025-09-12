import mongoose, { Schema, Document, model } from "mongoose";

export interface IFavorite extends Document {
  userId: mongoose.Types.ObjectId;
  bookId: string; 
}

const favoriteSchema = new Schema<IFavorite>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  bookId: { type: String, required: true },
});

export default mongoose.models.Favorite || model<IFavorite>("Favorite", favoriteSchema);
