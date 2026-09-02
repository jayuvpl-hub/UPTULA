/** @deprecated Use categoryValidation.js */
const { validateCategoryPair } = require('./categoryValidation');

module.exports = {
  validateCategoryPair,
  validateRegistrationCategoryPair: validateCategoryPair,
};
