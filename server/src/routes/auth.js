import { Router } from 'express';
import bcrypt from 'bcryptjs';
import Organization from '../models/Organization.js';
import User from '../models/User.js';
import { signToken, requireAuth } from '../middleware/auth.js';

const router = Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const publicUser = (user, org) => ({
  id: user._id,
  email: user.email,
  organization: { id: org._id, name: org.name },
});

router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, organizationName } = req.body || {};
    const fields = {};
    if (!EMAIL_RE.test(String(email || '').trim())) fields.email = 'Enter a valid email address.';
    if (!password || String(password).length < 8) fields.password = 'Use at least 8 characters.';
    if (!String(organizationName || '').trim()) fields.organizationName = 'Enter your organization name.';
    if (Object.keys(fields).length) return res.status(400).json({ message: 'Check the highlighted fields.', fields });

    const normalized = String(email).trim().toLowerCase();
    if (await User.findOne({ email: normalized })) {
      return res.status(409).json({ message: 'An account with this email already exists.', fields: { email: 'Already in use.' } });
    }

    const org = await Organization.create({ name: String(organizationName).trim() });
    try {
      const user = await User.create({
        email: normalized,
        passwordHash: await bcrypt.hash(String(password), 10),
        organization: org._id,
      });
      res.status(201).json({ token: signToken(user), user: publicUser(user, org) });
    } catch (e) {
      await Organization.findByIdAndDelete(org._id); // don't leave an orphan org
      throw e;
    }
  } catch (e) {
    next(e);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Enter your email and password.' });
    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    const ok = user && (await bcrypt.compare(String(password), user.passwordHash));
    if (!ok) return res.status(401).json({ message: 'Email or password is incorrect.' });
    const org = await Organization.findById(user.organization);
    res.json({ token: signToken(user), user: publicUser(user, org) });
  } catch (e) {
    next(e);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    const org = user && (await Organization.findById(user.organization));
    if (!user || !org) return res.status(401).json({ message: 'Log in to continue.' });
    res.json({ user: publicUser(user, org) });
  } catch (e) {
    next(e);
  }
});

export default router;
