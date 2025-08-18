# Time Tracker 9000

A command-line time tracking application that helps you log work hours with detailed categorization.

## Features

- **Automatic Directory Structure**: Creates `~/timesheets/YYYY/MM/` directory structure
- **Daily CSV Files**: Generates CSV files named `YYYY-MM-DD.csv` for each day
- **Interactive Prompts**: Guides you through entering time entries
- **Smart Updates**: Updates existing entries when category and description match
- **Global CLI**: Available from anywhere in your terminal as `timetrack`

## Installation

1. Clone or download this project
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   npm install
   ```
4. Make it globally available:
   ```bash
   npm link
   ```

## Usage

Simply run the command from anywhere in your terminal:

```bash
timetrack
```

The application will prompt you for:
- **Hours**: Number of hours worked (accepts decimals like 2.5)
- **Category**: Main category of work
- **Description**: Detailed description of the work
- **Sub-category**: Optional sub-category (defaults to "NA" if left empty)

## File Structure

The application creates the following structure in your home directory:

```
~/timesheets/
├── 2024/
│   ├── 01/
│   │   ├── 2024-01-15.csv
│   │   └── 2024-01-16.csv
│   └── 02/
│       └── 2024-02-01.csv
└── 2025/
    └── 08/
        └── 2025-08-18.csv
```

## CSV Format

Each daily CSV file contains the following columns:
- **Timestamp**: When the entry was created/updated
- **Hours**: Number of hours worked
- **Category**: Main work category
- **Description**: Work description
- **Sub-Category**: Sub-category or "NA"

## Smart Entry Updates

If you enter a time entry with the same category and description as an existing entry for the same day, the application will:
- Add the hours to the existing entry
- Update the timestamp
- Notify you of the update

## Example

```bash
$ timetrack
🕐 Time Tracker 9000
===================
? Hours (float): 2.5
? Category: Development
? Description: Fixed login bug
? Sub-category (press Enter for NA): Frontend

Updated existing entry. Total hours: 5.0
Entry saved to: /Users/username/timesheets/2024/08/2024-08-18.csv
Date: 2024-08-18
Hours: 2.5
Category: Development
Description: Fixed login bug
Sub-Category: Frontend

✅ Time entry recorded successfully!
```
