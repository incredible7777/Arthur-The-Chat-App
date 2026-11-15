import jwt from "jsonwebtoken";

/**
 * Middleware to verify JWT token in Express HTTP requests
 */
export const VerifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader||!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No authentication token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret_key");
    req.user = decoded; // Attach user payload ({ userId, email, isGuest }) to request object
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
  }
};

/**
 * Middleware to verify JWT token during Socket.IO connection handshake
*/
export const VerifySocketToken = (socket, next) => {
   // 1. Grab the secret token from the browser's connection request
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];
  // 2. If no token was sent, reject the call immediately!
  if (!token) {
    return next(new Error("Authentication error: No socket token provided"));
  }

  try {
    // 3. Decode the token using your secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret_key");
    // 4. Attach the user's details to this socket connection
    socket.user = decoded; 
    next(); // Pass! Let them in!
  } catch (error) {
    return next(new Error("Authentication error: Invalid or expired socket token"));
  }
};