const joi = require("joi");

const today = new Date();
today.setHours(0, 0, 0, 0);
const todayEpoch = Math.floor(today.getTime() / 1000);

const createEventSchema = joi.object({
  name: joi.string().required(),
  description: joi.string().required(),
  venue: joi.string().required(),
  date: joi.number().min(todayEpoch).required(),
  totalSeats: joi.number().required().max(50),
  pricePerSeat: joi.number().required(),
  category: joi.string().required(),
});

const getEventsSchema = joi.object({
  page: joi.number().required(),
  limit: joi.number().required(),
  category: joi.valid("sports", "music", "arts", "concert"),
  search: joi.string().optional(),
  upcoming: joi.boolean().optional(),
});

const patchEventSchema = joi
  .object({
    price: joi.number().optional(),
    description: joi.string().optional(),
    venue: joi.string().optional(),
    date: joi.number().min(todayEpoch).required(),
  })
  .min(1);

const patchSeatStatusSchema = joi.object({
  eventId: joi.string().required(),
  seatNumber: joi.string().required(),
  status: joi.valid("available", "locked", "booked"),
  userId: joi.string().required(),
});

module.exports = {
  createEventSchema,
  getEventsSchema,
  patchEventSchema,
  patchSeatStatusSchema,
};
