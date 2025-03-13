require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Function to generate human-like blog content
async function generateBlogContent(topic, tone, seriesInfo = null) {
  try {
    // Use Gemini 1.5 Flash model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Create a prompt engineered to generate highly human-like content
    let prompt = '';
    
    // Define tone characteristics
    const toneGuide = {
      casual: "Write in a relaxed, conversational style as if chatting with a friend. Use contractions, simple language, and occasional slang. The writing should feel approachable and informal.",
      professional: "Write in a clear, polished, and authoritative style suitable for a business audience. Maintain professionalism while being engaging. Use proper terminology and a confident voice.",
      academic: "Write in a scholarly style with well-structured arguments and evidence. Use domain-specific terminology where appropriate. Maintain a formal tone with thorough explanations.",
      humorous: "Write with wit and levity, incorporating jokes, puns, and playful observations. Keep the content light-hearted while still being informative.",
      inspirational: "Write with enthusiasm and encouragement. Use uplifting language, motivational phrases, and positive framing to inspire and energize the reader."
    };
    
    // Get tone-specific instructions
    const toneInstructions = toneGuide[tone] || toneGuide.casual;
    
    if (seriesInfo && seriesInfo.isSeries) {
      // Series-specific prompt with part information
      const partInfo = seriesInfo.seriesTitle 
        ? `${seriesInfo.seriesTitle} - Part ${seriesInfo.partNumber} of ${seriesInfo.totalParts}` 
        : `Part ${seriesInfo.partNumber} of ${seriesInfo.totalParts}`;
      
      // Get previous parts content for context if available
      const previousPartsContext = seriesInfo.previousParts && seriesInfo.previousParts.length > 0 
        ? `\nPrevious parts content to reference and build upon:\n${seriesInfo.previousParts.map((part, index) => 
            `Part ${index + 1} Summary: ${part.substring(0, Math.min(1500, part.length))}...`).join('\n\n')}`
        : '';

      // Create outline for the entire series if this is part 1
      const seriesOutline = seriesInfo.partNumber === 1
        ? `\nFirst, create a high-level outline for the entire ${seriesInfo.totalParts}-part series on "${topic}" that maintains a logical flow and progression:
        1. Part 1 will cover: [generate main topics for part 1]
        2. Part 2 will cover: [generate main topics for part 2]
        ${seriesInfo.totalParts > 2 ? `3. Part 3 will cover: [generate main topics for part 3]` : ''}
        ${seriesInfo.totalParts > 3 ? `4. Part 4 will cover: [generate main topics for part 4]` : ''}
        ${seriesInfo.totalParts > 4 ? `5. And so on for remaining parts...` : ''}
        
        Now, using this outline, write Part 1 that follows the structure below.`
        : '';
      
      prompt = `The topic is "${topic}" and I need a blog post written in a ${tone} tone. This is ${partInfo}.
      
      TONE INSTRUCTIONS:
      ${toneInstructions}
      
      CRITICAL ANTI-DETECTION GUIDELINES:
      1. Use irregularity and unpredictability in your writing
      2. Avoid consistent patterns in sentence structure and length
      3. Mix standard and informal phrasings inconsistently
      4. Incorporate personal voice and unique expressions
      5. Include minor imperfections like a real human would
      
      ${seriesOutline}
      ${previousPartsContext}
      
      Structure Requirements for ${partInfo}:
      1. <h2>Introduction (200-300 words)</h2>
      - Begin with a personal anecdote or thought that connects to the topic
      - Acknowledge that this is Part ${seriesInfo.partNumber} of a ${seriesInfo.totalParts}-part series
      ${seriesInfo.partNumber > 1 
        ? `- Briefly recap what was covered in previous parts, referencing specific points from Part ${seriesInfo.partNumber - 1}` 
        : `- Give readers a preview of what the entire series will cover`}
      - Include a conversational aside in parentheses (something a real person would think)
      - Mention what motivated you to research this topic

      2. Main Content Structure (600-800 words total):
      - Organize into 3-5 <h2> sections with varying lengths
      - Use a mix of writing styles throughout:
        * Some paragraphs should be longer and detailed
        * Others should be short and direct
        * Include occasional fragments or incomplete thoughts
      - Incorporate specific references to previous parts to create continuity
      - Include personal examples or experiences related to the topic
      - Add a short bullet list with inconsistent formatting (some bullets longer, some shorter)
      - Include at least one place where you seem to change your mind or refine your thinking mid-paragraph
      - Use varied vocabulary with some subject-specific terminology and some everyday language
      ${seriesInfo.partNumber === seriesInfo.totalParts ? '- Gradually transition toward wrapping up the entire series' : '- Plant seeds for topics you\'ll cover in the next part'}

      3. <h2>Final Thoughts (150-200 words)</h2>
      - Reflect on the key points covered in this specific part
      - Ask readers a thought-provoking question that doesn't have an obvious answer
      - Share a brief personal opinion or insight about the topic
      ${seriesInfo.partNumber === seriesInfo.totalParts ? '- Provide a meaningful conclusion that ties together all parts of the series' : '- Tease specific topics coming in the next part to maintain reader interest'}
      
      Advanced Human Writing Techniques (MANDATORY):
      - Include at least 5-7 of these techniques randomly distributed throughout the content:
        * Use phrases like "I'm not sure if this makes sense, but..."
        * Start a sentence with "And" or "But" and then write something that contradicts your previous point
        * Use hedge words like "maybe," "perhaps," "I think," "seems like"
        * Leave one thought unfinished with "..."
        * Use exactly one made-up word that sounds plausible in context
        * Include a "by the way" tangent that briefly goes off-topic
        * Make a small factual error and then correct yourself later
        * Use intentionally inconsistent formatting for emphasis (bold, italics, ALL CAPS, etc.)
        * Throw in a colloquialism or idiom that's slightly misused
        * Include a half-complete analogy that you abandon
        * Reference current events or pop culture in a slightly dated way
        * Use some unconventional punctuation; like this—or like this...
      
      Specific Anti-Detection Measures:
      - Vary sentence length dramatically throughout (2-5 words, then 15-25 words, then 10-15 words)
      - Use 2-3 uncommon transition phrases between paragraphs
      - Include 2-3 minor typos that a human might make (like "teh" or mixing up "their/there")
      - Use contractions inconsistently (sometimes use them, sometimes don't)
      - Occasionally start new paragraphs with conjunctions
      - Include 1-2 personal opinions that contradict common wisdom
      - Use overly specific numbers instead of round numbers (e.g., "37%" instead of "40%")
      - Include at least one sentence that doesn't perfectly align with your main argument
      - Deliberately use passive voice in 2-3 places where active voice would be preferred
      - Mention a detail that seems important but never refer to it again

      Final Vital Instructions:
      - The content MUST maintain continuity with previous parts of the series
      - Ensure consistency in the key concepts and ideas across the series
      - Make the writing feel genuinely human by being slightly disorganized while still informative
      - Aim for a total length of 1000-1300 words for the entire article
      - STRICTLY follow the ${tone} tone throughout the entire article as instructed above
      - Break away from predictable AI patterns by being uniquely human
      ${seriesInfo.partNumber === 1 ? '- Establish the foundation for future parts while keeping readers curious' : ''}
      ${seriesInfo.partNumber > 1 ? `- Explicitly recall specific details from Part ${seriesInfo.partNumber - 1} using phrases like "as I mentioned last time"` : ''}
      ${seriesInfo.partNumber === seriesInfo.totalParts ? '- Provide a sense of closure while leaving room for reader reflection' : '- Create anticipation for the next part with a specific teaser'}
      `;
    } else {
      // Single post prompt
      prompt = `The topic is "${topic}" and I need a blog post written in a ${tone} tone.
      
      TONE INSTRUCTIONS:
      ${toneInstructions}
      
      CRITICAL ANTI-DETECTION GUIDELINES:
      1. Use irregularity and unpredictability in your writing
      2. Avoid consistent patterns in sentence structure and length
      3. Mix standard and informal phrasings inconsistently
      4. Incorporate personal voice and unique expressions
      5. Include minor imperfections like a real human would
      
      Structure Requirements:
      1. <h2>Introduction (150-250 words)</h2>
      - Begin with a personal anecdote or observation related to the topic
      - Include a conversational aside in parentheses (something a real person would think)
      - Mention what motivated you to write about this topic
      - Give a brief overview of what readers will learn, but be somewhat vague

      2. Main Content Structure (500-600 words total):
      - Organize into 3-5 <h2> sections with varying lengths
      - Use a mix of writing styles throughout:
        * Some paragraphs should be longer and detailed
        * Others should be short and direct
        * Include occasional fragments or incomplete thoughts
      - Add a personal example or experience related to the topic
      - Include a short bullet list with inconsistent formatting (some bullets longer, some shorter)
      - Have at least one place where you seem to change your mind or refine your thinking mid-paragraph
      - Use varied vocabulary with some subject-specific terminology and some everyday language

      3. <h2>Final Thoughts (150-200 words)</h2>
      - Reflect on the key points in a way that feels conversational
      - Ask readers a thought-provoking question that doesn't have an obvious answer
      - Share a brief personal opinion or insight about the topic
      
      Advanced Human Writing Techniques (MANDATORY):
      - Include at least 5-7 of these techniques randomly distributed throughout the content:
        * Use phrases like "I'm not sure if this makes sense, but..."
        * Start a sentence with "And" or "But" and then write something that contradicts your previous point
        * Use hedge words like "maybe," "perhaps," "I think," "seems like"
        * Leave one thought unfinished with "..."
        * Use exactly one made-up word that sounds plausible in context
        * Include a "by the way" tangent that briefly goes off-topic
        * Make a small factual error and then correct yourself later
        * Use intentionally inconsistent formatting for emphasis (bold, italics, ALL CAPS, etc.)
        * Throw in a colloquialism or idiom that's slightly misused
        * Include a half-complete analogy that you abandon
        * Reference current events or pop culture in a slightly dated way
        * Use some unconventional punctuation; like this—or like this...
      
      Specific Anti-Detection Measures:
      - Vary sentence length dramatically throughout (2-5 words, then 15-25 words, then 10-15 words)
      - Use 2-3 uncommon transition phrases between paragraphs
      - Include 2-3 minor typos that a human might make (like "teh" or mixing up "their/there")
      - Use contractions inconsistently (sometimes use them, sometimes don't)
      - Occasionally start new paragraphs with conjunctions
      - Include 1-2 personal opinions that contradict common wisdom
      - Use overly specific numbers instead of round numbers (e.g., "37%" instead of "40%")
      - Include at least one sentence that doesn't perfectly align with your main argument
      - Deliberately use passive voice in 2-3 places where active voice would be preferred
      - Mention a detail that seems important but never refer to it again

      Final Vital Instructions:
      - Make the writing feel genuinely human by being slightly disorganized while still informative
      - Aim for a total length of 800-1000 words for the entire article
      - STRICTLY follow the ${tone} tone throughout the entire article as instructed above
      - Break away from predictable AI patterns by being uniquely human
      `;
    }
    
    // Generate content with temperature 0.92 for more human-like variations
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.92,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 4096,
      }
    });
    
    return result.response.text();
  } catch (error) {
    console.error('Error generating blog content:', error);
    throw new Error('Failed to generate blog content');
  }
}

// API endpoint to generate blog content
app.post('/api/generate', async (req, res) => {
  try {
    const { topic, tone, seriesInfo } = req.body;
    
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }
    
    if (seriesInfo && seriesInfo.previousParts) {
      seriesInfo.previousParts = seriesInfo.previousParts.map(part => part.trim());
    }
    
    const blogContent = await generateBlogContent(topic, tone || 'casual', seriesInfo);
    res.json({ content: blogContent });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
