const crypto = require('crypto');

const secret = process.env.AUTH_SECRET || process.env.JWT_SECRET || 'techmap_local_secret';

const base64url = (value) => Buffer.from(value)
  .toString('base64')
  .replace(/=/g, '')
  .replace(/\+/g, '-')
  .replace(/\//g, '_');

const fromBase64url = (value) => {
  const normalized = String(value).replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(normalized, 'base64').toString('utf8');
};

const sign = (payload) => {
  const body = base64url(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${signature}`;
};

const verify = (token) => {
  try {
    if (!token || !String(token).includes('.')) return null;
    const [body, signature] = String(token).split('.');
    const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
    if (Buffer.byteLength(signature || '') !== Buffer.byteLength(expected)) return null;
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
    return JSON.parse(fromBase64url(body));
  } catch {
    return null;
  }
};

const getTokenFromRequest = (req) => {
  const header = req.get('authorization') || '';
  if (header.toLowerCase().startsWith('bearer ')) return header.slice(7).trim();
  return req.get('x-auth-token') || req.query?.token || req.body?.token || '';
};

module.exports = { sign, verify, getTokenFromRequest };
