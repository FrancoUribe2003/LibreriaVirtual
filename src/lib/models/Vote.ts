import mongoose, { Schema, Document, model } from "mongoose";

export interface IVote extends Document {
  reviewId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  vote: number; 
}

const voteSchema = new Schema<IVote>({
  reviewId: { type: Schema.Types.ObjectId, ref: "Review", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  vote: { type: Number, enum: [1, -1], required: true },
});

export default mongoose.models.Vote || model<IVote>("Vote", voteSchema);
