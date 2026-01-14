require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3001,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  glmApiKey: process.env.GLM_API_KEY,
};
