import API from "./api";

/**
 * Send OTP to user's email
 */
export const requestOtp = async (email) => {
  const response = await API.post("/auth/send-otp", { email });
  return response.data;
};

/**
 * Verify 6-digit OTP code & receive JWT token
 */
export const verifyOtpCode = async (email, otp, username) => {
  const response = await API.post("/auth/verify-otp", { email, otp, username });
  return response.data;
};

/**
 * Instant Guest Mode login
 */
export const loginAsGuest = async () => {
  const response = await API.post("/auth/guest-login");
  return response.data;
};

/**
 * Fetch current user profile & friends
 */
export const getMyProfile = async () => {
  const response = await API.get("/user/me");
  return response.data;
};

/**
 * Search users by username or email
 */
export const searchUsersApi = async (query) => {
  const response = await API.get(`/user/search?q=${encodeURIComponent(query)}`);
  return response.data;
};

/**
 * Send Friend Request
 */
export const sendFriendRequestApi = async (targetUserId) => {
  const response = await API.post("/user/friend-request", { targetUserId });
  return response.data;
};

/**
 * Accept Friend Request
 */
export const acceptFriendRequestApi = async (senderId) => {
  const response = await API.post("/user/accept-friend", { senderId });
  return response.data;
};

/**
 * Unfriend / Remove Friend
 */
export const removeFriendApi = async (targetUserId) => {
  const response = await API.post("/user/remove-friend", { targetUserId });
  return response.data;
};

/**
 * Report User for spam or harassment
 */
export const reportUserApi = async (reportedUserId, reason, details) => {
  const response = await API.post("/user/report", { reportedUserId, reason, details });
  return response.data;
};