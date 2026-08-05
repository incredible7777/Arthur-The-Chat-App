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
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];

  if (!token) {
    return next(new Error("Authentication error: No socket token provided"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret_key");
    socket.user = decoded; // Attach user payload to socket instance
    next();
  } catch (error) {
    return next(new Error("Authentication error: Invalid or expired socket token"));
  }
};