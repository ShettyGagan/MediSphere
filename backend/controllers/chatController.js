import { chatClient } from "../utils/stream.js";

/**
 * Generate Stream token for authenticated user
 * Used by frontend to connect to Stream Chat/Video
 */
export const getStreamToken = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    const token = chatClient.createToken(userId);

    res.status(200).json({
      token,
      userId,
      userName: req.user.name,
      userImage: req.user.profileImage || "",
      userRole: req.user.role,
    });
  } catch (error) {
    console.error("Error in getStreamToken:", error.message);
    res.status(500).json({ message: "Failed to generate stream token" });
  }
};
