#!/bin/bash

# Test setup script - run this to create test files
echo "Creating test files and directories..."

# Create test directory structure
mkdir -p test-files/{documents,projects,config,logs}

# Create test files for different scenarios

# 1. Marksheet/Grade related files
cat > test-files/documents/semester_marksheet_2024.txt << 'EOF'
Student Grade Report - Fall 2024
================================
Student Name: John Doe
Student ID: 12345

Course Grades:
- Mathematics: A (95/100)
- Physics: B+ (87/100) 
- Chemistry: A- (92/100)
- English: B (83/100)

Overall GPA: 3.7
Total Credits: 16

Semester: Fall 2024
Date Generated: December 15, 2024
EOF

cat > test-files/documents/final_grades_spring.csv << 'EOF'
student_id,name,math,physics,chemistry,english,gpa
12345,John Doe,95,87,92,83,3.7
12346,Jane Smith,88,92,89,91,3.8
12347,Bob Johnson,76,78,82,79,3.1
EOF

# 2. Configuration files
cat > test-files/config/database_config.json << 'EOF'
{
  "database": {
    "host": "localhost",
    "port": 5432,
    "name": "myapp_db",
    "username": "admin",
    "password": "secret123"
  },
  "connection_pool": {
    "min": 5,
    "max": 20,
    "timeout": 30000
  }
}
EOF

cat > test-files/config/app_settings.ini << 'EOF'
[server]
port=8080
host=0.0.0.0
debug=true

[logging]
level=INFO
file=app.log
max_size=10MB
EOF

# 3. Meeting notes
cat > test-files/documents/project_kickoff_meeting_notes.md << 'EOF'
# Project Kickoff Meeting Notes
Date: January 15, 2025
Attendees: Alice, Bob, Charlie, Diana

## Agenda
1. Project overview
2. Timeline discussion
3. Resource allocation
4. Next steps

## Key Decisions
- Project deadline: March 30, 2025
- Weekly standup meetings every Tuesday
- Use Agile methodology
- Budget approved: $50,000

## Action Items
- Alice: Create project charter by Jan 20
- Bob: Set up development environment
- Charlie: Design database schema
- Diana: Create UI mockups

## Next Meeting
January 22, 2025 at 2 PM
EOF

# 4. Budget/Finance files
cat > test-files/documents/q4_budget_2024.txt << 'EOF'
Q4 2024 Budget Report
====================

Revenue:
- Product Sales: $125,000
- Service Revenue: $45,000
- Total Revenue: $170,000

Expenses:
- Salaries: $80,000
- Office Rent: $12,000
- Marketing: $15,000
- Software Licenses: $8,000
- Total Expenses: $115,000

Net Profit: $55,000
Profit Margin: 32.4%

Budget vs Actual:
- Revenue Target: $160,000 (Exceeded by 6.25%)
- Expense Budget: $120,000 (Under by 4.17%)
EOF

# 5. Log files
cat > test-files/logs/application_error.log << 'EOF'
2025-01-10 10:15:23 ERROR [DatabaseManager] Connection timeout to database server
2025-01-10 10:15:24 WARN [AuthService] Failed login attempt for user: admin
2025-01-10 10:18:45 ERROR [PaymentProcessor] Credit card validation failed
2025-01-10 10:20:12 INFO [UserManager] New user registered: user123
2025-01-10 10:22:33 ERROR [EmailService] SMTP server unreachable
2025-01-10 10:25:11 WARN [CacheManager] Redis connection unstable
EOF

# 6. Todo/Task files
cat > test-files/documents/vacation_planning_todo.txt << 'EOF'
Vacation Planning Checklist
===========================

Before Trip:
□ Book flight tickets
□ Reserve hotel accommodation
□ Apply for visa (if needed)
□ Pack suitcases
□ Arrange pet care
□ Hold mail delivery
□ Backup important documents

During Trip:
□ Check-in to hotel
□ Visit local attractions
□ Try local cuisine
□ Take lots of photos
□ Buy souvenirs

After Trip:
□ Unpack luggage
□ Process photos
□ Write trip journal
□ Share experiences with friends
EOF

# 7. Contact information
cat > test-files/documents/client_contacts.csv << 'EOF'
name,company,email,phone,address
John Smith,Acme Corp,john@acme.com,555-0123,"123 Main St, City"
Sarah Johnson,Tech Solutions,sarah@techsol.com,555-0456,"456 Oak Ave, Town"
Mike Wilson,Global Industries,mike@global.com,555-0789,"789 Pine Rd, Village"
EOF

# 8. Invoice files
cat > test-files/documents/invoice_december_2024.txt << 'EOF'
INVOICE #INV-2024-120
=====================

Bill To:
ABC Company
123 Business Street
New York, NY 10001

Invoice Date: December 15, 2024
Due Date: January 15, 2025

Services:
- Web Development (40 hours) @ $100/hr: $4,000
- Database Setup (8 hours) @ $120/hr: $960
- Testing & QA (16 hours) @ $80/hr: $1,280

Subtotal: $6,240
Tax (8.25%): $514.80
Total Amount: $6,754.80

Payment Terms: Net 30 days
EOF

echo "Test files created successfully!"
echo ""
echo "Directory structure:"
find test-files -type f | sort