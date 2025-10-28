module.exports = {
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '12h',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_WINDOW_MS || '900000', 10), // 15m
    max: parseInt(process.env.RATE_MAX || '300', 10),
  },
};

