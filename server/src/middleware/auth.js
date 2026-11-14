import jwt from 'jsonwebtoken';

export function signToken(user) {
  return jwt.sign(
    { sub: String(user._id), org: String(user.organization) },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Every protected request carries the organization id from the signed token,
// so route handlers never trust an org id sent by the client.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Log in to continue.' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    req.orgId = payload.org;
    next();
  } catch {
    res.status(401).json({ message: 'Your session has expired. Log in again.' });
  }
}
