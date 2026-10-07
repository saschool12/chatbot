/**
 * Vercel Serverless Function: /api/chat
 * Powered by Google Gemini 3.5 AI with Rule-Based Fallback.
 */

const GEMINI_MODEL = "gemini-3.5-flash-lite";

const jokes = [
  "Why do programmers prefer dark mode? Because light attracts bugs! 🐛",
  "Why did the Java developer wear glasses? Because they didn't C#! 👓",
  "There are only 10 types of people in the world: those who understand binary, and those who don't. 💻",
  "A SQL query walks into a bar, walks up to two tables and asks: 'Can I join you?' 🍺",
  "Why do programmers always mix up Halloween and Christmas? Because Oct 31 == Dec 25! 🎃🎄",
  "How many programmers does it take to change a light bulb? None, that's a hardware problem. 💡",
  "A programmer's wife says: 'Go to the store and get a loaf of bread. If they have eggs, get a dozen.' The programmer returns with 12 loaves of bread. 🍞",
  "Debugging: Being the detective in a crime movie where you are also the murderer. 🕵️‍♂️"
];

async function callGemini(message, personality, apiKey) {
  const systemPrompt = personality === 'coder'
    ? "You are NovaChat, a world-class senior software engineer and Java architect. Provide clear, accurate, idiomatic code examples with markdown formatting. Explain deep architectural principles and best practices."
    : personality === 'friendly'
    ? "You are NovaChat, a warm, positive, and cheerful AI assistant. Use friendly language and emojis while providing thoroughly accurate answers."
    : personality === 'concise'
    ? "You are NovaChat, a highly concise and direct AI assistant. Provide bullet points and direct answers without unnecessary filler."
    : "You are NovaChat, an intelligent AI assistant. Provide helpful, clear, and insightful answers. Format code snippets in markdown with language tags.";

  const payload = {
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    contents: [
      {
        role: "user",
        parts: [{ text: message }]
      }
    ]
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API HTTP ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("No text returned by Gemini");
  }
  return text;
}

function ruleFallback(message, conversationId) {
  const lower = (message || '').toLowerCase();
  if (lower.includes('joke')) {
    return {
      reply: `😄 ${jokes[Math.floor(Math.random() * jokes.length)]}`,
      suggestions: ["Tell me another joke", "Explain OOP", "Java Hello World"]
    };
  }
  if (lower.includes('time')) {
    return {
      reply: `🕒 The current time is **${new Date().toLocaleTimeString()}**.`,
      suggestions: ["What is today's date?", "Tell me a joke"]
    };
  }
  return {
    reply: "Hello! I am NovaChat, powered by **Gemini 3.5 AI**. How can I help you today?",
    suggestions: ["Explain Java OOP", "What is Spring Boot?", "Tell me a joke", "Write code for me"]
  };
}

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'UP',
      service: 'NovaChat Gemini AI Cloud Serverless',
      model: GEMINI_MODEL,
      timestamp: new Date().toISOString()
    });
  }

  if (req.method === 'POST') {
    const { message, conversationId, personality, apiKey: clientApiKey } = req.body || {};
    const convId = conversationId || 'conv_' + Date.now();
    const effectiveKey = (clientApiKey && clientApiKey.trim())
      || process.env.GEMINI_API_KEY
      || "";

    try {
      const aiReply = await callGemini(message, personality, effectiveKey);
      return res.status(200).json({
        reply: aiReply,
        conversationId: convId,
        timestamp: new Date().toISOString(),
        status: "success",
        suggestions: [
          "Tell me more",
          "Can you give an example?",
          "Explain simply",
          "Write code for this"
        ]
      });
    } catch (err) {
      console.warn("Gemini API call failed, falling back to rule engine:", err.message);
      const fallback = ruleFallback(message, convId);
      return res.status(200).json({
        reply: fallback.reply,
        conversationId: convId,
        timestamp: new Date().toISOString(),
        status: "success",
        suggestions: fallback.suggestions
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
