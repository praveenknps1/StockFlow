import { Router } from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Organization from '../models/Organization.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const orgId = new mongoose.Types.ObjectId(req.orgId);
    const org = await Organization.findById(orgId);
    const fallback = org.defaultLowStockThreshold;

    const lowStockExpr = {
      $expr: { $lte: ['$quantityOnHand', { $ifNull: ['$lowStockThreshold', fallback] }] },
    };

    const [totals, lowCount, lowItems] = await Promise.all([
      Product.aggregate([
        { $match: { organization: orgId } },
        { $group: { _id: null, products: { $sum: 1 }, units: { $sum: '$quantityOnHand' } } },
      ]),
      Product.countDocuments({ organization: orgId, ...lowStockExpr }),
      Product.find({ organization: orgId, ...lowStockExpr }).sort({ quantityOnHand: 1 }).limit(25),
    ]);

    res.json({
      totalProducts: totals[0]?.products ?? 0,
      totalUnits: totals[0]?.units ?? 0,
      lowStockCount: lowCount,
      defaultLowStockThreshold: fallback,
      lowStock: lowItems.map((p) => ({
        id: p._id,
        name: p.name,
        sku: p.sku,
        quantityOnHand: p.quantityOnHand,
        lowStockThreshold: p.lowStockThreshold ?? fallback,
        usesDefaultThreshold: p.lowStockThreshold == null,
      })),
    });
  } catch (e) {
    next(e);
  }
});

export default router;
