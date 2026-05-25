const authToken = require('./authToken');

const authenticate = (req, res, next) => {
  const token = authToken.getTokenFromRequest(req);
  const user = authToken.verify(token);
  if (!user) {
    return res.status(401).json({ error: 'Token inválido o expirado. Inicia sesión nuevamente.' });
  }
  req.user = user;
  next();
};

const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticación requerida.' });
    }
    if (allowedRoles.length && !allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'No tienes permiso para acceder a este recurso.' });
    }
    next();
  };
};

module.exports = { authenticate, authorize };