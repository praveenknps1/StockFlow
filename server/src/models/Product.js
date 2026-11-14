import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    quantityOnHand: { type: Number, required: true, default: 0, min: 0 },
    costPrice: { type: Number, default: null, min: 0 },
    sellingPrice: { type: Number, default: null, min: 0 },
    lowStockThreshold: { type: Number, default: null, min: 0 },
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// SKU is unique per organization (case-insensitive).
productSchema.index(
  { organization: 1, sku: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } }
);

export default mongoose.model('Product', productSchema);
