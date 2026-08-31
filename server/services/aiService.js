import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Service to process AI prompts and execute intelligent commands
 */
export const processAiRequest = async ({ prompt, user, friends = [], activeChatMessages = [] }) => {
  const cleanPrompt = prompt.trim().toLowerCase();

  // 1. Detect Intent: List Friends 👥
  if (
    cleanPrompt.includes("show my friends") ||
    cleanPrompt.includes("friend list") ||
    cleanPrompt.includes("my friends") ||
    cleanPrompt.includes("who are my friends") ||
    cleanPrompt.includes("list friends")
  ) {
    if (!friends || friends.length === 0) {
      return {
        reply: "You don't have any friends added yet. You can type **Add user [username]** to send a friend request!",
        action: "LIST_FRIENDS",
        friendsData: [],
      };
    }

    const onlineCount = friends.filter((f) => f.isOnline).length;
    const friendListStr = friends
      .map((f) => `• **${f.username}** (${f.isOnline ? "🟢 Online" : "⚪ Offline"})`)
      .join("\n");

    return {
      reply: `You currently have **${friends.length} friend${friends.length > 1 ? "s" : ""}** (${onlineCount} online):\n\n${friendListStr}`,
      action: "LIST_FRIENDS",
      friendsData: friends,
    };
  }

  // 2. Detect Intent: Unfriend / Remove Friend ❌
  const unfriendKeywords = ["unfriend", "unfollow", "remove friend", "delete friend", "remove "];
  for (const keyword of unfriendKeywords) {
    if (cleanPrompt.includes(keyword)) {
      const parts = cleanPrompt.split(keyword);
      let targetName = parts[1] ? parts[1].trim().replace(/[.?!"']/g, "") : "";
      if (targetName.startsWith("user ")) targetName = targetName.replace("user ", "").trim();
      if (targetName.startsWith("from my friends")) targetName = targetName.replace("from my friends", "").trim();

      if (!targetName) {
        return {
          reply: "Who would you like to unfriend? Please type **Unfriend [username]**.",
          action: "NONE",
        };
      }

      // Find matching friend in user's friend list
      const matchedFriend = friends.find(
        (f) => f.username.toLowerCase() === targetName.toLowerCase()
      );

      if (!matchedFriend) {
        return {
          reply: `I couldn't find **${targetName}** in your friend list. Double-check the username and try again!`,
          action: "NONE",
        };
      }

      return {
        reply: `Removing **${matchedFriend.username}** from your friends list...`,
        action: "REMOVE_FRIEND",
        targetUserId: matchedFriend._id,
        targetUsername: matchedFriend.username,
      };
    }
  }

  // 3. Detect Intent: Add Friend / Follow ➕
  const addKeywords = ["add friend", "follow ", "add user ", "send friend request to ", "add "];
  for (const keyword of addKeywords) {
    if (cleanPrompt.includes(keyword)) {
      const parts = cleanPrompt.split(keyword);
      let targetName = parts[1] ? parts[1].trim().replace(/[.?!"']/g, "") : "";
      if (targetName.startsWith("user ")) targetName = targetName.replace("user ", "").trim();

      if (!targetName) {
        return {
          reply: "Who would you like to add? Please type **Add user [username]**.",
          action: "NONE",
        };
      }

      return {
        reply: `Searching for **${targetName}** to send a friend request...`,
        action: "ADD_FRIEND",
        targetUsername: targetName,
      };
    }
  }

  // 4. Detect Intent: Summarize Active Chat 📝
  if (
    cleanPrompt.includes("summarize") ||
    cleanPrompt.includes("summary of chat") ||
    cleanPrompt.includes("catch up")
  ) {
    if (!activeChatMessages || activeChatMessages.length === 0) {
      return {
        reply: "There are no messages in the currently selected chat to summarize yet!",
        action: "NONE",
      };
    }

    const recentMsgs = activeChatMessages.slice(-15);
    const formattedChat = recentMsgs
      .map((m) => {
        const senderName = typeof m.sender === "object" ? m.sender.username : "User";
        return `${senderName}: ${m.message || "[Media attachment]"}`;
      })
      .join("\n");

    const summaryPrompt = `Summarize the following recent conversation concisely in 2-3 bullet points:\n\n${formattedChat}`;

    return await queryGeminiOrFallback({
      prompt: summaryPrompt,
      systemInstruction: "You are Arthur AI, a helpful chat summarizer. Summarize concisely with key highlights.",
      fallbackReply: `**Chat Summary (Recent ${recentMsgs.length} messages):**\n• The conversation features active discussion between participants.\n• ${recentMsgs.length} total messages exchanged in this session.`,
    });
  }

  // 5. Default General Q&A / Conversation (Gemini API)
  const systemInstruction = `You are Arthur AI, an intelligent, friendly AI chatbot embedded in Arthur Chat App created by Atulya. Help users answer questions, write code, rephrase text, or converse politely. Keep responses concise, well-formatted, and helpful.`;

  return await queryGeminiOrFallback({
    prompt,
    systemInstruction,
    fallbackReply: getFallbackAnswer(cleanPrompt),
  });
};

/**
 * Helper to call Gemini API or return fallback reply if API key is not configured
 */
const queryGeminiOrFallback = async ({ prompt, systemInstruction, fallbackReply }) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction,
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      return {
        reply: text,
        action: "NONE",
      };
    } catch (error) {
      console.error("Gemini API Error:", error.message);
      return {
        reply: fallbackReply || "I encountered a temporary issue connecting to Gemini AI. Here is what I know:\n" + getFallbackAnswer(prompt),
        action: "NONE",
      };
    }
  } else {
    // Smart Fallback when GEMINI_API_KEY is not set yet
    return {
      reply: fallbackReply || getFallbackAnswer(prompt),
      action: "NONE",
    };
  }
};

/**
 * Fallback answers when GEMINI_API_KEY is not set in .env
 */
const getFallbackAnswer = (cleanPrompt) => {
  if (cleanPrompt.includes("hello") || cleanPrompt.includes("hi") || cleanPrompt.includes("hey")) {
    return "Hello! 👋 I'm **Arthur AI**, your intelligent floating assistant! You can ask me questions, ask me to show your friends, unfriend someone, or summarize your active chat!";
  }
  if (cleanPrompt.includes("who are you") || cleanPrompt.includes("what can you do")) {
    return "I am **Arthur AI 🤖**! Here is what I can do for you:\n\n" +
      "1. 👥 **Show my friends** - View your friend list & online status.\n" +
      "2. ❌ **Unfriend [username]** - Remove a friend automatically.\n" +
      "3. ➕ **Add user [username]** - Send a friend request.\n" +
      "4. 📝 **Summarize chat** - Summarize active chat history.\n" +
      "5. 💡 **Q&A & Assistance** - Answer questions & help you with messages!\n\n" +
      "*(Tip: Set `GEMINI_API_KEY` in `server/.env` for unlimited Gemini AI responses!)*";
  }
  if (cleanPrompt.includes("help") || cleanPrompt.includes("app")) {
    return "**Arthur Chat Features:**\n• Real-Time Messaging & Read Receipts\n• Passwordless Email OTP Login\n• Image & File Sharing\n• Unsend & Pin Messages\n• Admin Command Center (/admin)\n• Floating AI Assistant (Arthur AI)";
  }
  return `I received your message: "${cleanPrompt}". You can command me to **show my friends**, **unfriend [name]**, **add user [name]**, or **summarize chat**! Add your \`GEMINI_API_KEY\` in \`server/.env\` for full AI answers! 🚀`;
};
