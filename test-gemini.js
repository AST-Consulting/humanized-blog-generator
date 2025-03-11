require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize the API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testGemini() {
  try {
    // Get the gemini-1.5-flash model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Test with a simple prompt
    const prompt = "Write a short paragraph about technology";
    
    console.log("Testing Gemini API connection...");
    const result = await model.generateContent(prompt);
    
    console.log("\nAPI connection successful!");
    console.log("\nSample response:");
    console.log(result.response.text());
  } catch (error) {
    console.error("Error testing Gemini API:", error);
  }
}

testGemini();
