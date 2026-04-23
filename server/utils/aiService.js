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
