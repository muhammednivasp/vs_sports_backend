const jwt = require("jsonwebtoken");

module.exports.clubAuthentication = async (req, res, next) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        message: "Club Authentication failed: Token not found",
        success: false,
      });
    }
    const secretKey = process.env.JwtClubSecretKey;
    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        return res.status(401).json({
          message: "Club Authentication failed: Invalid token",
          success: false,
        });
      } else {
        
        req.userId = decoded.userId;
        next();
      }
    });
  } catch (error) {
    return res.status(401).json({
      message: "Club Authentication failed",
      success: false,
    });
  }
};
