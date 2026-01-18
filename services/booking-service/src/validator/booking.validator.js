const joi = require("joi");

const createBookingSchema = joi.object({
  eventId: joi.string().required(),
  seats: joi.array().required().min(1)
});

const validatePatchBookingSchema = joi.object({
  paymentId: joi.string().required(),
  status: joi.string().required(),
  transactionId: joi.string().required(),
})

module.exports = { createBookingSchema , validatePatchBookingSchema};
