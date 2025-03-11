require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    // Check if the API supports listing models
    if (typeof genAI.listModels === 'function') {
      console.log("Attempting to list available models...");
      const models = await genAI.listModels();
      console.log("Available models:", models);
    } else {
      console.log("This version of the SDK doesn't support listing models directly.");
      console.log("SDK Version:", require('@google/generative-ai/package.json').version);
      
      // Let's try to create a simple test with a few known model names
      console.log("\nTesting some common model names:");
      const modelNames = [
        'gemini-pro',
        'gemini-1.0-pro',
        'gemini-1.5-pro',
        'text-bison',
        'chat-bison',
        'embedding-gecko'
      ];
      
      for (const modelName of modelNames) {
        try {
          console.log(`\nTesting model: ${modelName}`);
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent("Hello, what models are available?");
          console.log(`✅ Model ${modelName} works!`);
          console.log("Sample response:", result.response.text().substring(0, 100) + "...");
        } catch (error) {
          console.log(`❌ Model ${modelName} failed:`, error.message);
        }
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

listModels();
