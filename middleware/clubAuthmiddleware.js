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
   //  console.log("Secret Key:", secretKey);

    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
      //   console.log("Error while verifying token:", err);
        return res.status(401).json({
          message: "Club Authentication failed: Invalid token",
          success: false,
        });
      } else {
        req.userId = decoded.userId;
        console.log(req.userId, "12id", decoded);
        next();
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(401).json({
      message: "Club Authentication failed",
      success: false,
    });
  }
};
