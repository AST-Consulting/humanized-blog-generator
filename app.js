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
async function generateBlogContent(topic, tone = 'casual', seriesInfo = null) {
  try {
    // Use Gemini 1.5 Flash model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Create a prompt engineered to generate highly human-like content
    let prompt = '';
    
    if (seriesInfo && seriesInfo.isSeries) {
      // Series-specific prompt with part information
      const partInfo = seriesInfo.seriesTitle 
        ? `${seriesInfo.seriesTitle} - Part ${seriesInfo.partNumber} of ${seriesInfo.totalParts}` 
        : `Part ${seriesInfo.partNumber} of ${seriesInfo.totalParts}`;
      
      prompt = 
      ` the topic is ${topic} and you have to write it in ${tone} tone. This is ${partInfo}. follow the structure below:
      
      Write like a person with thoughts bouncing everywhere but trying to stay somewhat on-topic for a blog post.

      Structure Requirements:
      1. <h2>Introduction</h2>
      - Start with acknowledgment that this is Part ${seriesInfo.partNumber} of a ${seriesInfo.totalParts}-part series
      - Reference what was covered in earlier parts (or what will be covered in future parts if this is Part 1)
      - Add a random thought in parentheses that seems irrelevant
      - Mention that you've been researching this topic for a while (but don't be too specific)

      2. Main Content Structure:
      - Use 4-8 <h2> headings with totally inconsistent capitalization and punctuation
      - Never follow exactly the same pattern for any two sections
      - Interrupt yourself mid-section to start a new topic at least twice
      - Switch between formal writing and casual ramblings unpredictably
      - Insert a bullet list that doesn't follow proper formatting (<ul><li>)
      - Reference something you said earlier but get it slightly wrong
      - Correct yourself later for a mistake you didn't actually make
      - Randomly digress into a personal story that's only tangentially related
      - Make connections to previous parts in the series (for parts 2+) or set up for future parts
      ${seriesInfo.partNumber === seriesInfo.totalParts ? '- Wrap up the series with a conclusion that somewhat ties everything together' : '- End with a teaser for the next part'}
      
      Writing Style MUSTS:
      - Vary sentence length WILDLY (3 words to 30+ words)
      - Leave grammar mistakes unfixed (wrong verb tense, subject-verb agreement issues)
      - Use run-on sentences connected by commas where periods should be
      - Start at least 5 sentences with "And" or "But" or "So"
      - Randomly capitalize Words that don't need it
      - forget to capitalize some words that should be
      - Use inconsistent punctuation....sometimes too many periods...sometimes none
      - Mix up metaphors slightly ("that really hit the nail on the cake")
      - Start explaining something technical then abandon it mid-thought
      - Include exactly 3-4 typos (like "teh" or "adn")
      - Use em dashes — but sometimes use two dashes -- instead
      - Insert unnecessary quotation marks around "normal" words
      - Reference something earlier that you never actually mentioned
      - Switch between past and present tense mid-paragraph
      - Insert parenthetical thoughts (sometimes forgetting to close them
      - Begin numbering points but then stop using numbers
      - Use contractions inconsistently (sometimes don't, sometimes do not)
      - Repeat words accidentally (like "the the")
      - Write one paragraph that's way too long compared to the others
      - Include phrases like "anyway" and "where was I?" and "oh right"
      - Abruptly change topics with minimal transition
      - Use rhetorical questions? Then answer some but not others
      - Include a made-up statistic without any source
      - Refer to "common knowledge" that isn't actually common

      Final Vital Instructions:
      - If any part looks too organized, structured, or predictable - redo it
      - Every paragraph should have at least ONE unexpected element
      - The content should seem like it was written in one sitting without editing
      - Make sure it feels like a real person wrote it in a hurry but still cared about the topic
      - Never follow a consistent format for more than two paragraphs in a row
      - Content should still be valuable and informative despite the chaotic presentation
      - Ultimately it should read like a knowledgeable person wrote it while slightly distracted
      - ${seriesInfo.partNumber === 1 ? 'Make it clear this is the start of a series and there will be more parts coming' : ''}
      - ${seriesInfo.partNumber > 1 ? `Reference specific things from earlier parts (say "as I mentioned in Part ${seriesInfo.partNumber - 1}")` : ''}
      - ${seriesInfo.partNumber === seriesInfo.totalParts ? 'Include a clear series conclusion that ties things together somewhat' : 'Include a teaser for the next part with what will be covered'}
      `;
    } else {
      // Regular single post prompt (unchanged)
      prompt = 
      ` the topic is ${topic} and you have to write it in ${tone} tone. follow the structure below:
      
      Write like a person with thoughts bouncing everywhere but trying to stay somewhat on-topic for a blog post.


  Structure Requirements:
  1. <h2>Introduction</h2>
  - Start with something weirdly specific like "So last Tuesday I was reading about this while waiting for my dental appointment..."
  - Add a random thought in parentheses that seems irrelevant
  - Mention that you've been researching this topic for a while (but don't be too specific)

  2. Main Content Structure:
  - Use 4-8 <h2> headings with totally inconsistent capitalization and punctuation
  - Never follow exactly the same pattern for any two sections
  - Interrupt yourself mid-section to start a new topic at least twice
  - Switch between formal writing and casual ramblings unpredictably
  - Insert a bullet list that doesn't follow proper formatting (<ul><li>)
  - Reference something you said earlier but get it slightly wrong
  - Correct yourself later for a mistake you didn't actually make
  - Randomly digress into a personal story that's only tangentially related
  

  Writing Style MUSTS:
  - Vary sentence length WILDLY (3 words to 30+ words)
  - Leave grammar mistakes unfixed (wrong verb tense, subject-verb agreement issues)
  - Use run-on sentences connected by commas where periods should be
  - Start at least 5 sentences with "And" or "But" or "So"
  - Randomly capitalize Words that don't need it
  - forget to capitalize some words that should be
  - Use inconsistent punctuation....sometimes too many periods...sometimes none
  - Mix up metaphors slightly ("that really hit the nail on the cake")
  - Start explaining something technical then abandon it mid-thought
  - Include exactly 3-4 typos (like "teh" or "adn")
  - Use em dashes — but sometimes use two dashes -- instead
  - Insert unnecessary quotation marks around "normal" words
  - Reference something earlier that you never actually mentioned
  - Switch between past and present tense mid-paragraph
  - Insert parenthetical thoughts (sometimes forgetting to close them
  - Begin numbering points but then stop using numbers
  - Use contractions inconsistently (sometimes don't, sometimes do not)
  - Repeat words accidentally (like "the the")
  - Write one paragraph that's way too long compared to the others
  - Include phrases like "anyway" and "where was I?" and "oh right"
  - Abruptly change topics with minimal transition
  - Use rhetorical questions? Then answer some but not others
  - Include a made-up statistic without any source
  - Refer to "common knowledge" that isn't actually common

  Final Vital Instructions:
  - If any part looks too organized, structured, or predictable - redo it
  - Every paragraph should have at least ONE unexpected element
  - The content should seem like it was written in one sitting without editing
  - Make sure it feels like a real person wrote it in a hurry but still cared about the topic
  - Never follow a consistent format for more than two paragraphs in a row
  - Content should still be valuable and informative despite the chaotic presentation
  - Ultimately it should read like a knowledgeable person wrote it while slightly distracted
  `;
    }
    
    // Generate content with temperature 0.9 for more human-like variations
    const result = await model.generateContent(prompt);
    
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
