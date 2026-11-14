import { Router } from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Organization from '../models/Organization.js';

const router = Router();

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isId = (id) => mongoose.isValidObjectId(id);
const blank = (v) => v === undefined || v === null || v === '';

// Adds the effective threshold and low-stock flag the UI needs.
function decorate(p, orgDefault) {
  const obj = p.toObject ? p.toObject() : p;
  const effectiveThreshold = obj.lowStockThreshold ?? orgDefault;
  return { ...obj, effectiveThreshold, isLowStock: obj.quantityOnHand <= effectiveThreshold };
}

function parseProduct(body) {
  const fields = {};
  const data = {};

  const name = String(body.name ?? '').trim();
  if (!name) fields.name = 'Enter a product name.';
  else data.name = name;

  const sku = String(body.sku ?? '').trim();
  if (!sku) fields.sku = 'Enter a SKU.';
  else data.sku = sku;

  data.description = String(body.description ?? '').trim();

  const qty = blank(body.quantityOnHand) ? 0 : Number(body.quantityOnHand);
  if (!Number.isInteger(qty) || qty < 0) fields.quantityOnHand = 'Use a whole number, 0 or more.';
  else data.quantityOnHand = qty;

  for (const key of ['costPrice', 'sellingPrice']) {
    if (blank(body[key])) data[key] = null;
    else {
      const n = Number(body[key]);
      if (!Number.isFinite(n) || n < 0) fields[key] = 'Use a number, 0 or more.';
      else data[key] = n;
    }
  }

  if (blank(body.lowStockThreshold)) data.lowStockThreshold = null;
  else {
    const t = Number(body.lowStockThreshold);
    if (!Number.isInteger(t) || t < 0) fields.lowStockThreshold = 'Use a whole number, 0 or more.';
    else data.lowStockThreshold = t;
  }

  return { fields, data };
}

const dupeMessage = { message: 'This SKU is already used by another product.', fields: { sku: 'Already in use.' } };

router.get('/', async (req, res, next) => {
  try {
    const filter = { organization: req.orgId };
    const q = String(req.query.search || '').trim();
    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i');
      filter.$or = [{ name: rx }, { sku: rx }];
    }
    const [org, products] = await Promise.all([
      Organization.findById(req.orgId),
      Product.find(filter).sort({ createdAt: -1 }),
    ]);
    res.json({ products: products.map((p) => decorate(p, org.defaultLowStockThreshold)) });
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { fields, data } = parseProduct(req.body || {});
    if (Object.keys(fields).length) return res.status(400).json({ message: 'Check the highlighted fields.', fields });
    const product = await Product.create({ ...data, organization: req.orgId, lastUpdatedBy: req.userId });
    const org = await Organization.findById(req.orgId);
    res.status(201).json({ product: decorate(product, org.defaultLowStockThreshold) });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json(dupeMessage);
    next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(404).json({ message: 'Product not found.' });
    const product = await Product.findOne({ _id: req.params.id, organization: req.orgId });
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    const org = await Organization.findById(req.orgId);
    res.json({ product: decorate(product, org.defaultLowStockThreshold) });
  } catch (e) {
    next(e);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(404).json({ message: 'Product not found.' });
    const { fields, data } = parseProduct(req.body || {});
    if (Object.keys(fields).length) return res.status(400).json({ message: 'Check the highlighted fields.', fields });
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, organization: req.orgId },
      { ...data, lastUpdatedBy: req.userId },
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    const org = await Organization.findById(req.orgId);
    res.json({ product: decorate(product, org.defaultLowStockThreshold) });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json(dupeMessage);
    next(e);
  }
});

// Quick stock change: +/- N units.
router.patch('/:id/adjust', async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(404).json({ message: 'Product not found.' });
    const delta = Number(req.body?.delta);
    if (!Number.isInteger(delta) || delta === 0) {
      return res.status(400).json({ message: 'Enter a whole number other than 0, like 5 or -3.' });
    }
    const product = await Product.findOne({ _id: req.params.id, organization: req.orgId });
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    if (product.quantityOnHand + delta < 0) {
      return res.status(400).json({ message: `Only ${product.quantityOnHand} units on hand. You can't remove more than that.` });
    }
    product.quantityOnHand += delta;
    product.lastUpdatedBy = req.userId;
    await product.save();
    const org = await Organization.findById(req.orgId);
    res.json({ product: decorate(product, org.defaultLowStockThreshold) });
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(404).json({ message: 'Product not found.' });
    const result = await Product.deleteOne({ _id: req.params.id, organization: req.orgId });
    if (!result.deletedCount) return res.status(404).json({ message: 'Product not found.' });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
