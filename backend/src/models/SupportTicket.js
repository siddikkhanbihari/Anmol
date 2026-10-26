// ANMOL STORE - SupportTicket Model
import mongoose from 'mongoose';

const supportTicketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: String,
    subject: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['Order Issue', 'Payment', 'Seller Registration', 'Delivery', 'General Query'],
      default: 'General Query'
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open'
    },
    resolutionNotes: String
  },
  {
    timestamps: true
  }
);

export const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
