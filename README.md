# Findoc CLI

A powerful command-line tool for finding files using natural language descriptions. Findoc uses both AI-powered analysis (via Gemini API) and local keyword matching to help you locate files based on what you're looking for, not just exact filenames.

## Features

- 🔍 **Natural Language Search**: Describe what you're looking for in plain English
- 🤖 **AI-Powered Analysis**: Uses Google's Gemini API for intelligent file matching
- ⚡ **Fast Local Search**: Fallback to keyword-based matching when AI is unavailable
- 📁 **Recursive Directory Scanning**: Searches through nested directories
- 🎯 **Relevance Scoring**: Files are ranked by how well they match your query
- 📄 **Plaintext File Support**: Currently supports common text file formats
- 🚀 **Zero Configuration**: Works out of the box with sensible defaults

## Installation

### Prerequisites
- Node.js 14.0.0 or higher
- npm (comes with Node.js)

### Install Locally
```bash
# Clone or download the project
cd findoc-cli

# Install dependencies
npm install

# Make the CLI executable
npm run link
```

### Install Globally
```bash
# Install globally for system-wide access
npm run install-global
```

## Quick Start

### Basic Usage
```bash
# Force local search only (no AI)
node index.js "marksheet" -p test-files --no-ai

# Use specific API key
node index.js "marksheet" -p test-files --api-key YOUR_GEMINI_API_KEY

# After global installation, you can use 'findoc' directly
findoc "marksheet" -p test-files
findoc "marksheet" -p test-files --no-ai
```

## Command Line Options

```bash
node index.js <description> [options]

Arguments:
  description              Natural language description of the file you're looking for

Options:
  -p, --path <path>        Directory to search in (default: current directory)
  -l, --limit <number>     Maximum number of results to show (default: 10)
  -v, --verbose            Show file previews for top results
  --api-key <key>          Gemini API key (or set GEMINI_API_KEY env var)
  --no-ai                  Disable AI and use local keyword scoring only
  -h, --help               Display help for command
  -V, --version            Display version
```

**Note:** After global installation (`npm run install-global`), you can use `findoc` instead of `node index.js`.

## Environment Variables

Set your Gemini API key as an environment variable to avoid passing it with every command:

```bash
# Windows (Command Prompt)
set GEMINI_API_KEY=your_api_key_here

# Windows (PowerShell)
$env:GEMINI_API_KEY="your_api_key_here"

# Linux/macOS
export GEMINI_API_KEY=your_api_key_here
```

## Algorithms

### AI-Powered Mode (Gemini API)

When AI is enabled, Findoc uses a two-stage process:

#### 1. Query Analysis
The Gemini API analyzes your natural language query to extract:
- **Keywords**: Relevant search terms and synonyms
- **File Types**: Expected file extensions based on context
- **Context**: Understanding of what you're looking for

**Example Analysis:**
```
Query: "marksheet"
AI Response:
{
  "keywords": ["marksheet", "mark", "grade", "score", "result", "transcript", "gradesheet", "report card", "academic record"],
  "fileTypes": ["txt", "csv", "pdf"],
  "context": "The user is looking for a document containing their marks or grades, likely an academic record or report card."
}
```

#### 2. File Scoring
Each file is analyzed using AI to determine relevance:
- **Filename matching**: How well the filename relates to the query
- **Content analysis**: Relevance of file content (first 500 characters)
- **File type appropriateness**: Whether the file type makes sense for the query
- **Overall likelihood**: AI's assessment of whether this is what you want

**Scoring Scale:**
- 0-20: Not relevant at all
- 21-40: Slightly relevant
- 41-60: Moderately relevant
- 61-80: Highly relevant
- 81-100: Perfect match

### Local Mode (Keyword Matching)

When AI is disabled or unavailable, Findoc uses a simpler but faster approach:

#### 1. Keyword Extraction
```javascript
// Simple tokenization and filtering
const words = description.toLowerCase()
  .replace(/[^\w\s]/g, ' ')
  .split(/\s+/)
  .filter(word => word.length > 2);
```

#### 2. Basic Scoring Algorithm
```javascript
function fallbackScore(filePath, fileContent, keywords) {
  const fileName = path.basename(filePath).toLowerCase();
  const content = fileContent.toLowerCase();
  let score = 0;
  
  keywords.forEach(keyword => {
    // Filename matches get 20 points each
    if (fileName.includes(keyword.toLowerCase())) {
      score += 20;
    }
    // Content matches get 5 points each (max 30 per keyword)
    const contentMatches = (content.match(new RegExp(keyword.toLowerCase(), 'gi')) || []).length;
    score += Math.min(contentMatches * 5, 30);
  });
  
  return Math.min(score, 100);
}
```

## Supported File Types

Currently supports common plaintext file formats:
- `.txt` - Plain text files
- `.md` - Markdown files
- `.json` - JSON configuration/data files
- `.xml` - XML files
- `.csv` - Comma-separated values
- `.log` - Log files
- `.cfg`, `.conf` - Configuration files
- `.ini` - INI configuration files
- `.yaml`, `.yml` - YAML files
- Files without extensions (treated as text)

## Usage Examples

### 1. Academic Files
```bash
# Find grade reports or marksheets
node index.js "marksheet" -p test-files
node index.js "student grades" -p test-files
node index.js "transcript" -p test-files
```

**Output:**
```
Found 2 matching files (showing top 2):

1. documents\final_grades_spring.csv
   Relevance: 95% (AI) | Size: 0KB

2. documents\semester_marksheet_2024.txt
   Relevance: 95% (AI) | Size: 0KB
```

### 2. Configuration Files
```bash
# Find database configuration
node index.js "database configuration file" -p test-files
node index.js "database config" -p test-files --no-ai
```

**Output:**
```
Found 1 matching files (showing top 1):

1. config\database_config.json
   Relevance: 95% (AI) | Size: 0KB
```

### 3. Meeting Notes
```bash
# Find meeting notes
node index.js "meeting notes from project kickoff" -p test-files
node index.js "project meeting" -p test-files --verbose
```

**Output with --verbose:**
```
Found 1 matching files (showing top 1):

1. documents\project_kickoff_meeting_notes.md
   Relevance: 95% (AI) | Size: 1KB

--- File Previews ---

1. documents\project_kickoff_meeting_notes.md (95% relevance)
   Preview: # Project Kickoff Meeting Notes Date: January 15, 2025 Attendees: Alice, Bob, Charlie, Diana ## Agenda 1. Project overview 2. Timeline discussion 3. Resource allocation 4. Next steps ## Key Decisions - Project deadline: March 30, 2025 - Weekly standup meetings every Tuesday - Use Agile methodology - Budget approved: $50,000...
```

### 4. Financial Documents
```bash
# Find budget reports
node index.js "budget report for last quarter" -p test-files
node index.js "invoice from december" -p test-files
```

### 5. Log Files
```bash
# Find error logs
node index.js "log file with error messages" -p test-files
node index.js "application errors" -p test-files --no-ai
```

### 6. Task Lists
```bash
# Find todo lists
node index.js "vacation planning checklist" -p test-files
node index.js "todo list" -p test-files
```

## Performance Comparison

| Mode | Speed | Accuracy | API Required |
|------|-------|----------|--------------|
| AI-Powered | 0.6-22 seconds | High (95%+ relevance) | Yes |
| Local | ~13ms | Medium (20-25% relevance) | No |



## Project Structure

```
findoc-cli/
├── index.js              # Main CLI application
├── package.json          # Dependencies and scripts
├── setup_tests.sh        # Creates test files
├── run_tests.sh          # Interactive test suite
├── test-files/           # Sample files for testing
│   ├── documents/        # Academic, meeting, financial docs
│   ├── config/           # Configuration files
│   └── logs/             # Log files
└── README.md             # This file
```

## Dependencies

- **commander**: Command-line argument parsing
- **fs**: File system operations (Node.js built-in)
- **path**: Path utilities (Node.js built-in)
- **dotenv**: Environment variable loading (dev dependency)

## API Integration

### Gemini API Setup
1. Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Set the environment variable: `export GEMINI_API_KEY=your_key`
3. Or pass it directly: `findoc "query" --api-key your_key`

### API Usage
- Uses Gemini 1.5 Flash model for fast responses
- Two API calls per search: query analysis + file scoring
- Automatic fallback to local mode if API fails



## Troubleshooting

### Common Issues

**"Gemini API error: models/gemini-pro is not found"**
- Solution: The code has been updated to use `gemini-1.5-flash` model

**"No matching files found"**
- Try being more specific in your query
- Check if the search path is correct
- Ensure files are in supported formats

**"Error: Gemini API key is required"**
- Set `GEMINI_API_KEY` environment variable, or
- Use `--no-ai` flag for local search only

**Slow performance with AI**
- AI mode is slower but more accurate
- Use `--no-ai` for faster, basic searches
- Consider limiting search scope with `--path`

