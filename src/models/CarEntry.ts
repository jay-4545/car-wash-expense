import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICarEntry extends Document {
  carName: string;
  carNumber: string;
  amount: number;
  date: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CarEntrySchema = new Schema<ICarEntry>(
  {
    carName: { type: String, required: true, trim: true },
    carNumber: { type: String, required: true, trim: true, uppercase: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true, default: Date.now },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

const CarEntry: Model<ICarEntry> =
  mongoose.models.CarEntry || mongoose.model<ICarEntry>("CarEntry", CarEntrySchema);

export default CarEntry;
