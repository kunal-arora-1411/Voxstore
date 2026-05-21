const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    shopName: { type: String, required: true, trim: true },
    formData: { type: mongoose.Schema.Types.Mixed, required: true },
    generatedHtml: { type: String },
    siteUrl: { type: String },
    deployId: { type: String },
    status: {
      type: String,
      enum: ['pending', 'deploying', 'live', 'error'],
      default: 'pending',
    },
    visitCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Site', siteSchema);
