document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const topicInput = document.getElementById('topic');
    const toneSelect = document.getElementById('tone');
    const generateBtn = document.getElementById('generate-btn');
    const loadingIndicator = document.getElementById('loading');
    const blogOutput = document.getElementById('blog-output');
    const wordCountEl = document.getElementById('word-count');
    const copyBtn = document.getElementById('copy-btn');

    // Event listeners
    generateBtn.addEventListener('click', generateBlog);
    copyBtn.addEventListener('click', copyBlogContent);

    // Generate blog content
    async function generateBlog() {
        const topic = topicInput.value.trim();
        const tone = toneSelect.value;

        if (!topic) {
            alert('Please enter a blog topic');
            return;
        }

        // Show loading indicator
        blogOutput.innerHTML = '';
        loadingIndicator.classList.remove('hidden');
        generateBtn.disabled = true;
        copyBtn.disabled = true;

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ topic, tone })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate blog');
            }

            const data = await response.json();
            
            // Inject minor typing imperfections and randomness
            const humanizedContent = humanizeContent(data.content);
            
            // Display the content
            blogOutput.innerHTML = humanizedContent;
            
            // Update word count
            const wordCount = countWords(humanizedContent);
            wordCountEl.textContent = wordCount;
            
            // Enable copy button
            copyBtn.disabled = false;
        } catch (error) {
            console.error('Error:', error);
            blogOutput.innerHTML = `<p class="error">Error: ${error.message}</p>`;
        } finally {
            // Hide loading indicator
            loadingIndicator.classList.add('hidden');
            generateBtn.disabled = false;
        }
    }

    // Humanize content with minor imperfections to seem more human-like
    function humanizeContent(content) {
        // Break content into paragraphs
        let paragraphs = content.split(/\\n\\n+/);
        
        // Apply various humanizing transformations
        paragraphs = paragraphs.map(paragraph => {
            // Randomly add some typos and then fix them (strikethrough)
            if (Math.random() < 0.2) {
                const words = paragraph.split(' ');
                const randomIndex = Math.floor(Math.random() * words.length);
                if (words[randomIndex] && words[randomIndex].length > 3) {
                    const typoWord = words[randomIndex];
                    const chars = typoWord.split('');
                    // Swap two adjacent characters
                    const pos = Math.floor(Math.random() * (chars.length - 1));
                    [chars[pos], chars[pos+1]] = [chars[pos+1], chars[pos]];
                    const misspelledWord = chars.join('');
                    words[randomIndex] = `<span class="typo">${misspelledWord}</span> ${typoWord}`;
                    paragraph = words.join(' ');
                }
            }
            
            // Sometimes add italics for emphasis
            if (Math.random() < 0.3) {
                const sentences = paragraph.split('. ');
                const randomSentIndex = Math.floor(Math.random() * sentences.length);
                if (sentences[randomSentIndex]) {
                    const words = sentences[randomSentIndex].split(' ');
                    const randWordIndex = Math.floor(Math.random() * words.length);
                    if (words[randWordIndex] && words[randWordIndex].length > 3) {
                        words[randWordIndex] = `<em>${words[randWordIndex]}</em>`;
                        sentences[randomSentIndex] = words.join(' ');
                        paragraph = sentences.join('. ');
                    }
                }
            }
            
            return paragraph;
        });
        
        // Add some personal touches like ellipses or dashes
        paragraphs = paragraphs.map(p => {
            // Random chance to add ellipses or em dashes
            if (Math.random() < 0.15) {
                return p.replace(/\\.(?=\\s)/g, '...');
            }
            if (Math.random() < 0.1) {
                return p.replace(/,\\s/g, ' — ');
            }
            return p;
        });
        
        // Join paragraphs with double line breaks and wrap in paragraph tags
        return paragraphs.map(p => `<p>${p}</p>`).join('');
    }

    // Count words in content
    function countWords(content) {
        // Remove HTML tags and count words
        const text = content.replace(/<[^>]*>/g, '');
        return text.split(/\\s+/).filter(word => word.length > 0).length;
    }

    // Copy blog content to clipboard
    function copyBlogContent() {
        // Get text without HTML tags
        const text = blogOutput.innerText || blogOutput.textContent;
        
        navigator.clipboard.writeText(text)
            .then(() => {
                // Visual feedback for copy action
                copyBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyBtn.textContent = 'Copy';
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
                alert('Failed to copy content');
            });
    }
});
