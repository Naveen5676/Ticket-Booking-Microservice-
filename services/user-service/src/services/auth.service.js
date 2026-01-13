const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const jwtSecret = process.env.JWT_SECRET;
const jwtExpiry = process.env.JWT_EXPIRY;
const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;

const generateToken = async (userId) => {
  try {
    const token = jwt.sign({ userId }, jwtSecret, { expiresIn: jwtExpiry });
    return token;
  } catch (err) {
    console.error(err);
    throw new Error("Failed to generate token");
  }
};

const verifyToken = async (token) => {
  try {
    const decodedToken = jwt.verify(token, jwtSecret);
    return decodedToken;
  } catch (err) {
    console.error(err);
    throw new Error("Failed to verify token");
  }
};

const hashPassword = async (password) => {
  try {
    const hashedPwd = await bcrypt.hash(password, bcryptRounds);
    return hashedPwd;
  } catch (err) {
    console.error(err);
    throw new Error("Failed to hash password");
  }
};

const comparePassword = async (userPassword, hashPassword) => {
  try {
    const isMatch = await bcrypt.compare(userPassword, hashPassword);
    return isMatch;
  } catch (err) {
    console.error(err);
    throw new Error("Failed to compare password");
  }
};

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
};
