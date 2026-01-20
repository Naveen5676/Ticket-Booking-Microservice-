const joi = require("joi");

const createPaymentSchema = joi.object({
  bookingId: joi.string().required(),
  paymentMethod: joi.string().required(),
});

module.exports = {
  createPaymentSchema,
};
