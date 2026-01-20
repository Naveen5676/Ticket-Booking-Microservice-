const express = require("express");

const {processPayment , getPayment} = require("../controllers/payment.controller");

const router = express.Router();

router.post("/payments", processPayment);
router.get("/payments/:id", getPayment);

module.exports = router;