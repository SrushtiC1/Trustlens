const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config();

// Access your API key as an environment variable
const apiKey = process.env.GOOGLE_AI_KEY;
const isMockMode = !apiKey || apiKey === "your_google_ai_key_here";

let model;
if (!isMockMode) {
  const genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}

/**
 * Generates a natural language risk insight based on entity data.
 * @param {string} entity - The analyzed entity (URL/Phone/Email).
 * @param {string} type - The type of entity.
 * @param {number} score - The calculated trust score.
 * @param {Array} breakdown - The scoring breakdown factors.
 * @returns {Promise<string>} - The AI generated insight.
 */
exports.getRiskInsight = async (entity, type, score, breakdown) => {
  if (isMockMode) {
    return generateMockInsight(entity, type, score);
  }

  try {
    const prompt = `
      You are TrustLens AI, a security expert. 
      Analyze the following security data and provide a concise, professional, and actionable insight (2-3 sentences).
      
      Entity: ${entity}
      Type: ${type}
      Trust Score: ${score}/100
      Breakdown: ${JSON.stringify(breakdown)}
      
      Requirements:
      - Do not repeat the score numbers directly unless necessary.
      - Focus on WHY the score is high or low.
      - Provide one specific piece of advice for the user.
      - Keep it under 60 words.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return "AI Insight currently unavailable. Please rely on the manual breakdown below.";
  }
};

/**
 * Generates a conversational response for the AI assistant.
 * @param {Array} history - The chat history.
 * @param {string} message - The user's new message.
 * @returns {Promise<string>} - The AI generated response.
 */
exports.getChatResponse = async (history, message) => {
  if (isMockMode) {
    return generateMockChatResponse(message);
  }

  try {
    const chat = model.startChat({
      history: history.map(h => ({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.content }]
      })),
      systemInstruction: "You are TrustLens AI, a helpful and knowledgeable cybersecurity assistant. Your goal is to help users understand security risks, provide advice on staying safe online, and explain how TrustLens works. Keep your responses concise, professional, and friendly. Avoid technical jargon where possible, or explain it if necessary.",
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "I'm having trouble connecting to my brain right now. Please try again in a moment!";
  }
};

/**
 * Generates a simulated insight for demonstration purposes.
 */
function generateMockInsight(entity, type, score) {
  if (score >= 80) {
    return `[MOCK AI] This ${type} appears highly trustworthy based on its established reputation and secure configuration. You can proceed with confidence, but always remain vigilant for unusual requests.`;
  } else if (score >= 50) {
    return `[MOCK AI] This ${type} shows moderate risk. While it has some trust markers, certain factors like its age or community reports suggest caution. Avoid sharing sensitive data until you verify the source independently.`;
  } else {
    return `[MOCK AI] WARNING: This ${type} exhibits strong indicators of malicious activity or phishing. The low trust score is driven by suspicious patterns and lack of security credentials. We strongly recommend blocking or avoiding this entity entirely.`;
  }
}

/**
 * Generates a simulated chat response for demonstration purposes.
 */
function generateMockChatResponse(message) {
  const msg = message.toLowerCase();
  if (msg.includes("hello") || msg.includes("hi")) {
    return "[MOCK AI] Hello! I'm your TrustLens Assistant. How can I help you with your digital security today?";
  } else if (msg.includes("phishing")) {
    return "[MOCK AI] Phishing is a type of cyber attack where scammers try to trick you into giving up sensitive information like passwords or credit card numbers. TrustLens helps detect these by analyzing suspicious links and patterns.";
  } else if (msg.includes("score")) {
    return "[MOCK AI] Our Trust Score is calculated using a combination of heuristic analysis and machine learning models. We look at factors like domain age, SSL status, and community reports to give you a risk rating from 0 to 100.";
  } else {
    return "[MOCK AI] That's an interesting question! As your security assistant, I recommend always double-checking suspicious links and using strong, unique passwords for all your accounts. Is there anything specific about your analysis you'd like to know?";
  }
}
