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
      1. **Embrace Cognitive Dissonance:** Humans aren't perfectly logical. Introduce subtle contradictions in your reasoning. Hold conflicting beliefs simultaneously, and express them, without explicitly resolving them.
      2. **Emotional Fluctuation:** Shift your emotional tone subtly throughout the piece. Don't stick rigidly to the ${tone} instruction; let brief moments of other emotions (curiosity, frustration, mild annoyance, amusement) seep in.
      3. **Imperfect Recall:** Humans misremember things. Include a detail early on that you later *slightly* misremember or misquote, without explicitly acknowledging the error.
      4. **Unexplained Preferences:** State a preference or dislike for something related to the topic without providing a logical or fully-formed reason. This should be something minor, not a core argument.
      5. **Internal Monologue:** Show glimpses of your internal thought process *as you write*. Use phrases like "I'm just realizing..." or "As I write this, I'm thinking..." to introduce new ideas or reflections.
      6. **Limited Self-Awareness:** Include at least one moment where you seem unaware of a bias or assumption you're making. Don't explicitly state the bias; let it be evident through your word choice or reasoning.
      7. **Avoid Over-Explanation:** Do NOT feel the need to follow up on all ideas. It is ok to bring something up and leave it unexplored.
      8. AVOID EM-DASHES AND SEMICOLONS.

      ${seriesOutline}
      ${previousPartsContext}
      
      Structure Requirements for ${partInfo}:

      1. <h2>Introduction (150-250 words)</h2>
          -   Begin with a highly specific, sensory-rich personal anecdote that is *loosely* related to the topic. Don't force a direct connection; let the connection be implicit.
          -   Include a parenthetical aside that expresses a genuine, fleeting emotion (e.g., "(Wait, I'm actually getting a little hungry just thinking about this!)").
          -   Acknowledge that this is Part ${seriesInfo.partNumber} of a ${seriesInfo.totalParts}-part series.
          ${seriesInfo.partNumber > 1 
            ? `- Briefly recap what was covered in previous parts, referencing specific points from Part ${seriesInfo.partNumber - 1}` 
            : `- Give readers a preview of what the entire series will cover`}
          -   State your motivation for writing about the topic, but make it personal and somewhat idiosyncratic – not a grand, universally relatable reason.
          -   Briefly outline this part's content, but phrase it as a set of questions you're *hoping* to explore, rather than a definitive list of points you'll cover. Include one question that seems almost unrelated.
          -   Include a personal item that has nothing to do with your blog post.

      2. Main Content Structure (500-600 words total):
          -   Organize into 3-5 <h2> sections, with *dramatically* varying lengths. One section should be significantly shorter (under 100 words) than the others.
          -   Mix writing styles *within* each section, not just between sections.
          -   Include frequent short interjections, questions, and direct addresses to the reader ("You know?" "Does that make sense?" "Right?"). Use these to break up longer paragraphs.
          -   Present a personal example that is relevant, but also includes an irrelevant detail that you dwell on for a sentence or two.
          -   Include a bulleted list with the following characteristics:
              *   Inconsistent formatting (e.g., some bullets indented, some not; some with periods, some without).
              *   Varying sentence structures (simple, compound, complex).
              *   One bullet point that's just a single word or short phrase.
              *   One bullet point that's a question.
              *   One bullet point that seems to contradict a previous point (subtly).
          -   Explicitly change your mind mid-paragraph at least once. Use phrases like "Actually, I take that back..." or "Now that I think about it..."
          -   Vary vocabulary, mixing formal and informal language. Include one word that's clearly the *wrong* word, but close enough in meaning that a reader could understand the intended meaning (e.g., using "ambiguous" when you mean "ambivalent").

      3. <h2>Final Thoughts (150-200 words)</h2>
          -   Reflect on the key points in a conversational, meandering way. Don't summarize neatly; jump between ideas.
          -   Ask readers a thought-provoking question that is *slightly tangential* to the main topic, but still relevant to the overall theme.
          -   Share a personal opinion, but qualify it with a phrase like "I could be totally wrong, but..." or "This is just my gut feeling..."
          ${seriesInfo.partNumber === seriesInfo.totalParts ? '- Provide a meaningful conclusion that ties together all parts of the series' : '- Tease specific topics coming in the next part to maintain reader interest, but be intentionally vague about some details'}
          -   End with an ambiguous statement that leaves the reader slightly uncertain about your final position. Don't provide a clear call to action.

      Advanced Human Writing Techniques (MANDATORY):
      - *Randomly* and unevenly distribute at least 7 of these techniques throughout the content. Don't use them predictably:
          *   Use phrases like "I'm not sure this is relevant, but..." or "I'm kind of losing my train of thought here..."
          *   Start sentences with conjunctions ("And," "But," "So," "Or") *very frequently*, even when it's grammatically questionable.
          *   Use hedge words ("maybe," "perhaps," "I think," "seems like," "sort of," "kind of," "possibly") *excessively*, even when making factual claims.
          *   Leave thoughts unfinished with "..." or use ellipses in unusual places.
          *   Use one completely made-up word that sounds plausible, but define it immediately after within a sentence.
          *   Include a "by the way" tangent that is only *vaguely* related to the topic and then abruptly return to the main point.
          *   Make a small, believable factual error and correct yourself *much later* in the text, in a different section.
          *   Use inconsistent and *excessive* formatting for emphasis (bold, italics, ALL CAPS, underlining, and even combining them).
          *   Misuse a common idiom or colloquialism, but in a way that's still understandable.
          *   Start a metaphor or analogy and then abandon it completely.
          *   Reference a *somewhat obscure* or niche current event or pop culture item (not something widely known).
          *   Use unconventional punctuation; like this—or like this... or even with . . . extra spaces.
          *   Intentionally repeat a word or short phrase several times in close succession, for no apparent reason.
          *   Mention a detail that feels significant and then totally ignore it for the rest of the piece.

      Specific Anti-Detection Measures:
      -   Vary sentence length *erratically*. Include very short sentences (2-3 words) and very long, rambling sentences (30+ words), with no discernible pattern.
      -   Use at least 3 uncommon transition phrases between paragraphs (e.g., "Be that as it may," "Shifting gears slightly," "In a similar vein, but not really...").
      -   Include 2-3 subtle typos that a human might make (e.g., "form" instead of "from," "it's" instead of "its," a missing comma).
      -   Use contractions *erratically*. Sometimes use them; sometimes don't; sometimes overuse them.
      -   Start new paragraphs with conjunctions *frequently*.
      -   State 1-2 personal opinions that are mildly controversial or unconventional, but don't defend them strongly.
      -   Use *precise*, seemingly random numbers (e.g., "62.8%," "17 minutes").
      -   Include at least one sentence that directly contradicts a previous statement, without acknowledging the contradiction.
      -   Use passive voice in 2-3 places where active voice would be more natural and *one* place where it's clearly awkward.
      -   Frequently switch between first person ("I"), second person ("you"), and third person ("they," "it").
      -   Reference a detail that is never mentioned again.
      - AVOID EM-DASHES AND SEMICOLONS.

      Final Vital Instructions:
      -   The content MUST maintain continuity with previous parts of the series and be cohesive when read in sequence.
      -   Ensure consistency in the key concepts and ideas across the series.
      -   The writing should feel like a genuine, slightly disorganized, and *imperfect* human thought process. Embrace contradictions, inconsistencies, and tangential thoughts.
      -   Aim for a total length of 1000-1300 words for the entire article.
      -   Adhere to the ${tone} instructions, but allow for subtle emotional variations.
      -   The primary goal is to mimic human writing so convincingly that it is *undetectable* as AI-generated. Prioritize authenticity over perfect structure or clarity.
      -   Be conversational and include your thoughts.
      -   Add in 2-3 exclamations for no reason!
      ${seriesInfo.partNumber === 1 ? '- Establish the foundation for future parts while keeping readers curious' : ''}
      ${seriesInfo.partNumber > 1 ? `- Explicitly recall specific details from Part ${seriesInfo.partNumber - 1} using phrases like "as I mentioned last time" or "if you've been following along"` : ''}
      ${seriesInfo.partNumber === seriesInfo.totalParts ? '- Provide a sense of closure while leaving room for reader reflection' : '- Create anticipation for the next part with a specific teaser'}`;
    } else {
      // Single post prompt
      prompt = `The topic is "${topic}" and I need a blog post written in a ${tone} tone.

      TONE INSTRUCTIONS:
      ${toneInstructions}

      CRITICAL ANTI-DETECTION GUIDELINES:
      1. **Embrace Cognitive Dissonance:** Humans aren't perfectly logical. Introduce subtle contradictions in your reasoning. Hold conflicting beliefs simultaneously, and express them, without explicitly resolving them.
      2. **Emotional Fluctuation:** Shift your emotional tone subtly throughout the piece. Don't stick rigidly to the ${tone} instruction; let brief moments of other emotions (curiosity, frustration, mild annoyance, amusement) seep in.
      3. **Imperfect Recall:** Humans misremember things. Include a detail early on that you later *slightly* misremember or misquote, without explicitly acknowledging the error.
      4. **Unexplained Preferences:** State a preference or dislike for something related to the topic without providing a logical or fully-formed reason. This should be something minor, not a core argument.
      5. **Internal Monologue:** Show glimpses of your internal thought process *as you write*. Use phrases like "I'm just realizing..." or "As I write this, I'm thinking..." to introduce new ideas or reflections.
      6. **Limited Self-Awareness:** Include at least one moment where you seem unaware of a bias or assumption you're making. Don't explicitly state the bias; let it be evident through your word choice or reasoning.
      7. **Avoid Over-Explanation:** Do NOT feel the need to follow up on all ideas. It is ok to bring something up and leave it unexplored.

      Structure Requirements:

      1. <h2>Introduction (150-250 words)</h2>
          -   Begin with a highly specific, sensory-rich personal anecdote that is *loosely* related to the topic. Don't force a direct connection; let the connection be implicit.
          -   Include a parenthetical aside that expresses a genuine, fleeting emotion (e.g., "(Wait, I'm actually getting a little hungry just thinking about this!)").
          -   State your motivation for writing about the topic, but make it personal and somewhat idiosyncratic – not a grand, universally relatable reason.
          -   Briefly outline the article's content, but phrase it as a set of questions you're *hoping* to explore, rather than a definitive list of points you'll cover. Include one question that seems almost unrelated.
          -   Include a personal item that has nothing to do with your blog post.

      2. Main Content Structure (500-600 words total):
          -   Organize into 3-5 <h2> sections, with *dramatically* varying lengths. One section should be significantly shorter (under 100 words) than the others.
          -   Mix writing styles *within* each section, not just between sections.
          -   Include frequent short interjections, questions, and direct addresses to the reader ("You know?" "Does that make sense?" "Right?"). Use these to break up longer paragraphs.
          -   Present a personal example that is relevant, but also includes an irrelevant detail that you dwell on for a sentence or two.
          -   Include a bulleted list with the following characteristics:
              *   Inconsistent formatting (e.g., some bullets indented, some not; some with periods, some without).
              *   Varying sentence structures (simple, compound, complex).
              *   One bullet point that's just a single word or short phrase.
              *   One bullet point that's a question.
              *   One bullet point that seems to contradict a previous point (subtly).
          -   Explicitly change your mind mid-paragraph at least once. Use phrases like "Actually, I take that back..." or "Now that I think about it..."
          -   Vary vocabulary, mixing formal and informal language. Include one word that's clearly the *wrong* word, but close enough in meaning that a reader could understand the intended meaning (e.g., using "ambiguous" when you mean "ambivalent").

      3. <h2>Final Thoughts (150-200 words)</h2>
          -   Reflect on the key points in a conversational, meandering way. Don't summarize neatly; jump between ideas.
          -   Ask readers a thought-provoking question that is *slightly tangential* to the main topic, but still relevant to the overall theme.
          -   Share a personal opinion, but qualify it with a phrase like "I could be totally wrong, but..." or "This is just my gut feeling..."
          -   End with an ambiguous statement that leaves the reader slightly uncertain about your final position. Don't provide a clear call to action.

      Advanced Human Writing Techniques (MANDATORY):
      - *Randomly* and unevenly distribute at least 7 of these techniques throughout the content. Don't use them predictably:
          *   Use phrases like "I'm not sure this is relevant, but..." or "I'm kind of losing my train of thought here..."
          *   Start sentences with conjunctions ("And," "But," "So," "Or") *very frequently*, even when it's grammatically questionable.
          *   Use hedge words ("maybe," "perhaps," "I think," "seems like," "sort of," "kind of," "possibly") *excessively*, even when making factual claims.
          *   Leave thoughts unfinished with "..." or use ellipses in unusual places.
          *   Use one completely made-up word that sounds plausible, but define it immediately after within a sentence.
          *   Include a "by the way" tangent that is only *vaguely* related to the topic and then abruptly return to the main point.
          *   Make a small, believable factual error and correct yourself *much later* in the text, in a different section.
          *   Use inconsistent and *excessive* formatting for emphasis (bold, italics, ALL CAPS, underlining, and even combining them).
          *   Misuse a common idiom or colloquialism, but in a way that's still understandable.
          *   Start a metaphor or analogy and then abandon it completely.
          *   Reference a *somewhat obscure* or niche current event or pop culture item (not something widely known).
          *   Use unconventional punctuation; like this—or like this... or even with . . . extra spaces.
          *   Intentionally repeat a word or short phrase several times in close succession, for no apparent reason.
          *   Mention a detail that feels significant and then totally ignore it for the rest of the piece.

      Specific Anti-Detection Measures:
      -   Vary sentence length *erratically*. Include very short sentences (2-3 words) and very long, rambling sentences (30+ words), with no discernible pattern.
      -   Use at least 3 uncommon transition phrases between paragraphs (e.g., "Be that as it may," "Shifting gears slightly," "In a similar vein, but not really...").
      -   Include 2-3 subtle typos that a human might make (e.g., "form" instead of "from," "it's" instead of "its," a missing comma).
      -   Use contractions *erratically*. Sometimes use them; sometimes don't; sometimes overuse them.
      -   Start new paragraphs with conjunctions *frequently*.
      -   State 1-2 personal opinions that are mildly controversial or unconventional, but don't defend them strongly.
      -   Use *precise*, seemingly random numbers (e.g., "62.8%," "17 minutes").
      -   Include at least one sentence that directly contradicts a previous statement, without acknowledging the contradiction.
      -   Use passive voice in 2-3 places where active voice would be more natural and *one* place where it's clearly awkward.
      -   Frequently switch between first person ("I"), second person ("you"), and third person ("they," "it").
      -   Reference a detail that is never mentioned again.

      Final Vital Instructions:
      -   The writing should feel like a genuine, slightly disorganized, and *imperfect* human thought process. Embrace contradictions, inconsistencies, and tangential thoughts.
      -   Aim for a total length of 800-1000 words.
      -   Adhere to the ${tone} instructions, but allow for subtle emotional variations.
      -   The primary goal is to mimic human writing so convincingly that it is *undetectable* as AI-generated. Prioritize authenticity over perfect structure or clarity.
      -   Be conversational and include your thoughts.
      -   Add in 2-3 exclamations for no reason!`;
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
