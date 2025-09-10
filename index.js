#!/usr/bin/env node

const { program } = require('commander');
const fs = require('fs').promises;
const path = require('path');

class GeminiFileMatcher {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
  }

  async analyzeQuery(description) {
    const prompt = `
You are a file search assistant. Given a natural language description, extract the most relevant search terms and file characteristics.

User query: "${description}"

Respond with a JSON object containing:
{
  "keywords": ["list", "of", "relevant", "keywords"],
  "fileTypes": ["txt", "md", "csv", "json"] (likely file extensions),
  "context": "brief explanation of what the user is looking for"
}

Focus on:
- Key terms that would appear in filenames or content
- Synonyms and related terms
- Likely file types based on the description
- Context about the file's purpose

Examples:
- "marksheet" → keywords: ["mark", "grade", "score", "result", "transcript", "marks"], fileTypes: ["txt", "csv", "pdf"]
- "config file" → keywords: ["config", "configuration", "settings", "setup"], fileTypes: ["json", "xml", "cfg", "conf"]
- "meeting notes from yesterday" → keywords: ["meeting", "notes", "yesterday"], fileTypes: ["txt", "md"]
`;

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Gemini API error: ${data.error?.message || 'Unknown error'}`);
      }

      const content = data.candidates[0].content.parts[0].text;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse Gemini response');
      }
    } catch (error) {
      console.error('Error with Gemini API:', error.message);
      // Fallback to simple keyword extraction
      return this.fallbackAnalysis(description);
    }
  }

  fallbackAnalysis(description) {
    const words = description.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);

    return {
      keywords: words,
      fileTypes: ['txt', 'md', 'json', 'csv', 'log'],
      context: 'Fallback analysis - API unavailable'
    };
  }

  async scoreFileWithAI(filePath, fileContent, originalQuery, analysisResult) {
    const fileName = path.basename(filePath);
    const fileExt = path.extname(filePath).substring(1);
    const contentPreview = fileContent.substring(0, 500);

    const prompt = `
You are a file relevance scorer. Rate how well this file matches the user's search query.

User query: "${originalQuery}"
File name: "${fileName}"
File extension: "${fileExt}"
Content preview: "${contentPreview}"

Analysis context: ${analysisResult.context}
Expected keywords: ${analysisResult.keywords.join(', ')}

Rate the relevance on a scale of 0-100 where:
- 0-20: Not relevant at all
- 21-40: Slightly relevant
- 41-60: Moderately relevant  
- 61-80: Highly relevant
- 81-100: Perfect match

Consider:
1. How well the filename matches the query
2. How relevant the content is
3. Whether the file type makes sense
4. Overall likelihood this is what the user wants

Respond with just a number (0-100).
`;

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Gemini API error: ${data.error?.message || 'Unknown error'}`);
      }

      const content = data.candidates[0].content.parts[0].text.trim();
      const score = parseInt(content.match(/\d+/)?.[0] || '0');
      
      return Math.min(100, Math.max(0, score));
    } catch (error) {
      // Fallback to simple scoring
      return this.fallbackScore(filePath, fileContent, analysisResult.keywords);
    }
  }

  fallbackScore(filePath, fileContent, keywords) {
    const fileName = path.basename(filePath).toLowerCase();
    const content = fileContent.toLowerCase();
    let score = 0;
    
    keywords.forEach(keyword => {
      if (fileName.includes(keyword.toLowerCase())) {
        score += 20;
      }
      const contentMatches = (content.match(new RegExp(keyword.toLowerCase(), 'gi')) || []).length;
      score += Math.min(contentMatches * 5, 30);
    });
    
    return Math.min(score, 100);
  }
}

class FileScanner {
  constructor(apiKey, useAI = true) {
    this.matcher = new GeminiFileMatcher(apiKey);
    this.useAI = useAI;
    this.textExtensions = new Set(['.txt', '.md', '.json', '.xml', '.csv', '.log', '.cfg', '.conf', '.ini', '.yaml', '.yml']);
  }

  async isTextFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return this.textExtensions.has(ext) || ext === '';
  }

  async readFileContent(filePath) {
    try {
      const stats = await fs.stat(filePath);
      if (stats.size > 1024 * 1024) { // Skip files larger than 1MB
        return '';
      }
      
      const content = await fs.readFile(filePath, 'utf8');
      return content;
    } catch (error) {
      return '';
    }
  }

  async scanDirectory(dirPath, query, analysisResult, results = [], maxDepth = 10, currentDepth = 0) {
    if (currentDepth >= maxDepth) return results;
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          if (!entry.name.startsWith('.') && 
              !['node_modules', 'dist', 'build', '__pycache__', '.git'].includes(entry.name)) {
            await this.scanDirectory(fullPath, query, analysisResult, results, maxDepth, currentDepth + 1);
          }
        } else if (entry.isFile()) {
          if (!entry.name.startsWith('.') && await this.isTextFile(fullPath)) {
            const content = await this.readFileContent(fullPath);
            if (content) {
              const basicScore = this.matcher.fallbackScore(fullPath, content, analysisResult.keywords);
              if (!this.useAI) {
                if (basicScore > 20) {
                  results.push({
                    path: fullPath,
                    score: Math.min(100, basicScore),
                    name: entry.name,
                    size: (await fs.stat(fullPath)).size,
                    aiAnalyzed: false
                  });
                }
              } else if (basicScore > 10) {
                console.log(`Analyzing: ${path.relative(dirPath, fullPath)}...`);
                const aiScore = await this.matcher.scoreFileWithAI(fullPath, content, query, analysisResult);
                if (aiScore > 20) {
                  results.push({
                    path: fullPath,
                    score: aiScore,
                    name: entry.name,
                    size: (await fs.stat(fullPath)).size,
                    aiAnalyzed: true
                  });
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}: ${error.message}`);
    }
    
    return results;
  }
}

async function findFiles(description, searchPath = '.', options = {}) {
  const apiKey = process.env.GEMINI_API_KEY || options.apiKey;
  const useAI = !options.noAi && Boolean(apiKey);

  const scanner = new FileScanner(apiKey, useAI);
  
  console.log(`Analyzing query: "${description}"`);
  if (useAI) {
    console.log('Getting AI analysis...\n');
  } else {
    console.log('Using local keyword analysis (AI disabled or API key not provided).\n');
  }
  
  const analysisResult = useAI
    ? await scanner.matcher.analyzeQuery(description)
    : scanner.matcher.fallbackAnalysis(description);
  
  console.log(`${useAI ? 'AI' : 'Local'} Analysis:`);
  console.log(`- Context: ${analysisResult.context}`);
  console.log(`- Keywords: ${analysisResult.keywords.join(', ')}`);
  console.log(`- Expected file types: ${analysisResult.fileTypes.join(', ')}`);
  console.log(`- Search path: ${path.resolve(searchPath)}\n`);
  
  const startTime = Date.now();
  const results = await scanner.scanDirectory(searchPath, description, analysisResult);
  const endTime = Date.now();
  
  // Sort by score (highest first)
  results.sort((a, b) => b.score - a.score);
  
  const limit = options.limit || 10;
  const topResults = results.slice(0, limit);
  
  if (topResults.length === 0) {
    console.log('\nNo matching files found. Try being more specific or check the directory path.');
    return;
  }
  
  console.log(`\nFound ${results.length} matching files (showing top ${topResults.length}):\n`);
  
  topResults.forEach((result, index) => {
    const relativePath = path.relative(searchPath, result.path);
    const sizeKB = Math.round(result.size / 1024);
    const aiLabel = result.aiAnalyzed ? ' (AI)' : '';
    console.log(`${index + 1}. ${relativePath}`);
    console.log(`   Relevance: ${result.score}%${aiLabel} | Size: ${sizeKB}KB`);
    console.log('');
  });
  
  console.log(`Search completed in ${endTime - startTime}ms`);
  
  if (options.verbose && topResults.length > 0) {
    console.log('\n--- File Previews ---\n');
    for (let i = 0; i < Math.min(3, topResults.length); i++) {
      const result = topResults[i];
      const content = await scanner.readFileContent(result.path);
      const preview = content.substring(0, 300).replace(/\n/g, ' ');
      console.log(`${i + 1}. ${path.relative(searchPath, result.path)} (${result.score}% relevance)`);
      console.log(`   Preview: ${preview}${content.length > 300 ? '...' : ''}\n`);
    }
  }
}

// CLI Setup
program
  .name('findoc')
  .description('Find files using natural language descriptions powered by Gemini AI')
  .version('1.0.0');

program
  .argument('<description>', 'Natural language description of the file you\'re looking for')
  .option('-p, --path <path>', 'Directory to search in', '.')
  .option('-l, --limit <number>', 'Maximum number of results to show', '10')
  .option('-v, --verbose', 'Show file previews for top results')
  .option('--api-key <key>', 'Gemini API key (or set GEMINI_API_KEY env var)')
  .option('--no-ai', 'Disable AI and use local keyword scoring only')
  .action(async (description, options) => {
    try {
      const searchPath = path.resolve(options.path);
      const stats = await fs.stat(searchPath);
      
      if (!stats.isDirectory()) {
        console.error('Error: Search path must be a directory');
        process.exit(1);
      }
      
      await findFiles(description, searchPath, {
        limit: parseInt(options.limit),
        verbose: options.verbose,
        apiKey: options.apiKey,
        noAi: options.noAi
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.error('Error: Directory not found');
      } else {
        console.error('Error:', error.message);
      }
      process.exit(1);
    }
  });

program.parse();

module.exports = { FileScanner, GeminiFileMatcher };