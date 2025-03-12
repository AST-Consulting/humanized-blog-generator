document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const topicInput = document.getElementById('topic');
    const toneSelect = document.getElementById('tone');
    const generateBtn = document.getElementById('generate-btn');
    const loadingIndicator = document.getElementById('loading');
    const blogOutput = document.getElementById('blog-output');
    const wordCountEl = document.getElementById('word-count');
    const copyBtn = document.getElementById('copy-btn');
    
    // Series-related elements
    const isSeriesCheckbox = document.getElementById('is-series');
    const seriesControls = document.getElementById('series-controls');
    const seriesTitleInput = document.getElementById('series-title');
    const numPartsSelect = document.getElementById('num-parts');
    const seriesNavigation = document.getElementById('series-navigation');
    const seriesTabs = document.getElementById('series-tabs');

    // Store series content
    let seriesContent = [];
    let currentActivePart = 0;

    // Event listeners
    generateBtn.addEventListener('click', generateBlog);
    copyBtn.addEventListener('click', copyBlogContent);
    isSeriesCheckbox.addEventListener('change', toggleSeriesControls);

    // Toggle series controls visibility
    function toggleSeriesControls() {
        if (isSeriesCheckbox.checked) {
            seriesControls.classList.remove('hidden');
        } else {
            seriesControls.classList.add('hidden');
        }
    }

    // Generate blog content
    async function generateBlog() {
        const topic = topicInput.value.trim();
        const tone = toneSelect.value;
        const isSeries = isSeriesCheckbox.checked;
        const seriesTitle = seriesTitleInput.value.trim();
        const numParts = isSeries ? parseInt(numPartsSelect.value) : 1;

        if (!topic) {
            alert('Please enter a blog topic');
            return;
        }

        // Reset series content if generating a new series
        seriesContent = [];
        currentActivePart = 0;

        // Show loading indicator
        blogOutput.innerHTML = '';
        seriesTabs.innerHTML = '';
        seriesNavigation.classList.add('hidden');
        loadingIndicator.classList.remove('hidden');
        generateBtn.disabled = true;
        copyBtn.disabled = true;

        try {
            if (isSeries) {
                // Generate each part of the series
                for (let part = 1; part <= numParts; part++) {
                    await generateSeriesPart(topic, tone, part, numParts, seriesTitle);
                }
                
                // Create series navigation tabs
                createSeriesTabs(numParts);
                seriesNavigation.classList.remove('hidden');
                
                // Display the first part by default
                displaySeriesPart(0);
            } else {
                // Generate a single blog post
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
            }
            
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
    
    // Generate a single part of a series
    async function generateSeriesPart(topic, tone, partNumber, totalParts, seriesTitle) {
        const seriesInfo = {
            isSeries: true,
            partNumber,
            totalParts,
            seriesTitle
        };
        
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                topic, 
                tone,
                seriesInfo
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate series part');
        }

        const data = await response.json();
        
        // Inject minor typing imperfections and randomness
        const humanizedContent = humanizeContent(data.content);
        
        // Store this part
        seriesContent.push({
            content: humanizedContent,
            wordCount: countWords(humanizedContent)
        });
    }
    
    // Create tabs for series navigation
    function createSeriesTabs(numParts) {
        seriesTabs.innerHTML = '';
        
        for (let i = 0; i < numParts; i++) {
            const tab = document.createElement('div');
            tab.className = 'series-tab';
            tab.textContent = `Part ${i + 1}`;
            tab.dataset.partIndex = i;
            
            tab.addEventListener('click', function() {
                displaySeriesPart(parseInt(this.dataset.partIndex));
            });
            
            seriesTabs.appendChild(tab);
        }
    }
    
    // Display a specific part of the series
    function displaySeriesPart(partIndex) {
        // Update active tab
        const tabs = seriesTabs.querySelectorAll('.series-tab');
        tabs.forEach((tab, index) => {
            if (index === partIndex) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // Display the content
        blogOutput.innerHTML = seriesContent[partIndex].content;
        
        // Update word count
        wordCountEl.textContent = seriesContent[partIndex].wordCount;
        
        // Update current active part
        currentActivePart = partIndex;
    }

    // Humanize content with minor imperfections to seem more human-like
    function humanizeContent(content) {
        // Break content into paragraphs
        let paragraphs = content.split(/\n\n+/);
        
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
                return p.replace(/\.(?=\s)/g, '...');
            }
            if (Math.random() < 0.1) {
                return p.replace(/,\s/g, ' — ');
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
        return text.split(/\s+/).filter(word => word.length > 0).length;
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
