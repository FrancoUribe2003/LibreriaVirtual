import mongoose, { Schema, Document, model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string; 
  favorites: string[]; 
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  favorites: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || model<IUser>("User", userSchema);
