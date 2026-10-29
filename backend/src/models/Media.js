// ANMOL STORE - Cloud Media & Image Storage Model
// Stores uploaded product & shop images in MongoDB Atlas so they are permanently accessible
// across ALL devices (phones, laptops, tablets) and serverless environments (Vercel)
import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    contentType: {
      type: String,
      default: 'image/jpeg'
    },
    data: {
      type: Buffer,
      required: true
    },
    size: {
      type: Number,
      required: true
    }
  },
  {
    timestamps: true
  }
);

export const Media = mongoose.model('Media', mediaSchema);
