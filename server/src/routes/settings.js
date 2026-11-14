import { Router } from 'express';
import Organization from '../models/Organization.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const org = await Organization.findById(req.orgId);
    res.json({ defaultLowStockThreshold: org.defaultLowStockThreshold });
  } catch (e) {
    next(e);
  }
});

router.put('/', async (req, res, next) => {
  try {
    const raw = req.body?.defaultLowStockThreshold;
    const n = Number(raw);
    if (raw === '' || raw == null || !Number.isInteger(n) || n < 0) {
      return res.status(400).json({
        message: 'Check the highlighted fields.',
        fields: { defaultLowStockThreshold: 'Use a whole number, 0 or more.' },
      });
    }
    const org = await Organization.findByIdAndUpdate(req.orgId, { defaultLowStockThreshold: n }, { new: true });
    res.json({ defaultLowStockThreshold: org.defaultLowStockThreshold });
  } catch (e) {
    next(e);
  }
});

export default router;
