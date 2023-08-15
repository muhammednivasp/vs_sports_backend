const jwt = require("jsonwebtoken");

module.exports.adminAuthentication = (req, res, next) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed: Token not found",
      });
    }

    const secretKey = process.env.JwtAdminSecretKey;
    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return res.status(401).json({
            success: false,
            message: "Authentication failed: Token expired",
          });
        } else {
          return res.status(401).json({
            success: false,
            message: "Authentication failed: Invalid token",
          });
        }
      } else {
        req.userId = decoded.userId;
        next();
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
