import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IReview extends Document {
  name: string;
  handle: string;
  platform: 'twitter' | 'github';
  message: string;
  accentColor: string;
  approved: boolean;
  createdAt: Date;
  expiresAt: Date;
}

const ReviewSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  handle: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  platform: {
    type: String,
    enum: ['twitter', 'github'],
    required: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 1000,
  },
  accentColor: {
    type: String,
    required: true,
    match: /^#[0-9a-fA-F]{6}$/,
    default: '#10b981',
  },
  approved: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    index: { expireAfterSeconds: 0 }, // TTL index: auto-delete after expiresAt
  },
});

export const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
