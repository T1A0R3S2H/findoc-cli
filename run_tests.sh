#!/bin/bash

# Test scenarios for the findoc CLI tool
# Make sure you have your GEMINI_API_KEY set in .env file

echo "=== FINDOC CLI TEST SCENARIOS ==="
echo "Make sure your .env file has GEMINI_API_KEY set!"
echo ""

# Function to run test with header
run_test() {
    echo "----------------------------------------"
    echo "🔍 TEST: $1"
    echo "Query: '$2'"
    echo "----------------------------------------"
    node index.js "$2" -p test-files
    echo ""
    echo "Press Enter to continue to next test..."
    read
}

# Test 1: Academic/Grade files
run_test "Finding Grade/Marksheet Files" "marksheet with student grades"

# Test 2: Configuration files
run_test "Finding Config Files" "database configuration file"

# Test 3: Meeting notes
run_test "Finding Meeting Notes" "meeting notes from project kickoff"

# Test 4: Budget/Finance files  
run_test "Finding Budget Files" "budget report for last quarter"

# Test 5: Log files with errors
run_test "Finding Error Logs" "log file with error messages"

# Test 6: Todo lists
run_test "Finding Todo Lists" "vacation planning checklist"

# Test 7: Contact information
run_test "Finding Contact Info" "client contact information"

# Test 8: Invoice files
run_test "Finding Invoices" "invoice from december"

# Test 9: Complex query
run_test "Complex Natural Language Query" "I need the file where I wrote down tasks for my upcoming vacation"

# Test 10: Partial matching
run_test "Partial/Fuzzy Matching" "config for database connection"

echo "=== ADVANCED TESTS ==="

# Test with verbose mode
echo "----------------------------------------"
echo "🔍 VERBOSE TEST: Show file previews"
echo "----------------------------------------"
node index.js "meeting notes" -p test-files -v
echo ""

# Test with limit
echo "----------------------------------------"
echo "🔍 LIMIT TEST: Show only top 3 results"
echo "----------------------------------------"
node index.js "configuration" -p test-files -l 3
echo ""

# Test with non-existent query
echo "----------------------------------------"
echo "🔍 NO RESULTS TEST: Query that won't match"
echo "----------------------------------------"
node index.js "quantum physics research paper" -p test-files
echo ""

echo "=== ALL TESTS COMPLETED ==="