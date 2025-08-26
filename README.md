# Time Tracker 9000

A command-line time tracking application that helps you log work hours with detailed categorization. Available as standalone executables for Linux, macOS, and Windows - no Node.js installation required! macOS binaries are code-signed to prevent Gatekeeper issues.

## Features

- **Automatic Directory Structure**: Creates `~/timesheets/YYYY/MM/` directory structure
- **Daily CSV Files**: Generates CSV files named `YYYY-MM-DD.csv` for each day
- **Interactive Prompts**: Guides you through entering time entries
- **Smart Updates**: Updates existing entries when category and description match
- **Time Tracking System Integration**: Upload time entries directly to your time tracking system
- **CSV Management**: List, view, and manage your local CSV files
- **Interactive Menu**: Easy-to-use menu system for all operations
- **Cross-Platform**: Standalone executables for Linux, macOS (Intel & ARM), and Windows
- **Code Signed**: macOS binaries are automatically signed to prevent security warnings
- **No Dependencies**: Pre-built binaries require no Node.js installation
- **Global CLI**: Available from anywhere in your terminal as `timetrack`

## Installation

### Option 1: Download Pre-built Binary (Recommended)

1. Go to the [Releases page](https://github.com/ammilam/time-tracker-9000/releases)
2. Download the appropriate binary for your platform:
   - **Linux**: `time-tracker-9000-linux-x64.tar.gz`
   - **macOS Intel**: `time-tracker-9000-macos-x64.tar.gz`
   - **macOS Apple Silicon**: `time-tracker-9000-macos-arm64.tar.gz`
   - **Windows**: `time-tracker-9000-windows-x64.zip`

> **✅ macOS Users**: The binaries are now code-signed and should work without security warnings. If you still encounter issues, see the troubleshooting section below.

3. Extract the archive and move the binary to your PATH:

   **Linux:**
   ```bash
   # Extract the archive
   tar -xzf time-tracker-9000-linux-x64.tar.gz
   
   # Move to a directory in your PATH (requires sudo)
   sudo mv time-tracker-9000-linux-x64 /usr/local/bin/timetrack
   ```

   **macOS:**
   ```bash
   # Extract the archive (choose your architecture)
   tar -xzf time-tracker-9000-macos-arm64.tar.gz  # Apple Silicon (M1/M2/M3)
   # OR
   tar -xzf time-tracker-9000-macos-x64.tar.gz    # Intel

   # Move to a directory in your PATH
   sudo mv time-tracker-9000-macos-* /usr/local/bin/timetrack
   
   ```

   **Alternative for macOS (if above doesn't work):**
   ```bash
   # Place in your home directory instead
   mv time-tracker-9000-macos-* ~/timetrack
   chmod +x ~/timetrack
   xattr -d com.apple.quarantine ~/timetrack
   
   # Add to your shell profile (~/.zshrc or ~/.bash_profile)
   echo 'export PATH="$HOME:$PATH"' >> ~/.zshrc
   source ~/.zshrc
   ```

   **Windows:**
   ```cmd
   # Extract the zip file
   # Move time-tracker-9000-win-x64.exe to a folder in your PATH
   # Rename to timetrack.exe for easier usage
   ```

### Option 2: Build from Source

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

**Note**: If you downloaded the pre-built binary and placed it in your PATH as `timetrack`, the command will work immediately. If you're using the source installation with `npm link`, make sure Node.js is installed on your system.

### Interactive Menu

The application now features an interactive menu with the following options:

- **📝 Add new time entry**: Create a new time entry (original functionality)
- **📋 List CSV files**: View all your CSV files organized by date
- **👁️ View CSV file**: Display contents of a specific CSV file with totals
- **☁️ Upload to time tracking system**: Upload time entries from a CSV file to your time tracking system
- **⚙️ Time tracking system settings**: View and test your time tracking system configuration
- **🚪 Exit**: Close the application

### Adding Time Entries

When adding a new time entry, you'll be prompted for:
- **Hours**: Number of hours worked (accepts decimals like 2.5)
- **Category**: Main category of work
- **Description**: Detailed description of the work
- **Sub-category**: Optional sub-category (defaults to "NA" if left empty)

## Time Tracking System Integration

### Setup

1. **Create a `.env` file** in your project directory with your time tracking system credentials:

```bash
# Time Tracking System Configuration
TIME_TRACKING_TOKEN=your_base64_encoded_token
TIME_TRACKING_URL=https://your-timetracking-system.com/api/v2/
# Optional: Default project ID for time entries
TIME_TRACKING_PROJECT_ID=your_project_id
```

2. **Get your time tracking system token**:
   - Log into your time tracking system instance
   - Go to Settings → Access Tokens or similar section
   - Create a new token with appropriate permissions
   - The token should be base64 encoded in the format: `username:password` or `username:token`

3. **Test the connection** using the "⚙️ Time tracking system settings" menu option

### Uploading Time Entries

1. Use the "☁️ Upload to time tracking system" menu option
2. Select the CSV file you want to upload
3. The application will:
   - Test the connection to your time tracking system
   - Upload each time entry from the CSV
   - Show a summary of successful and failed uploads
   - Display detailed error messages for any failures

### Time Entry Format

CSV entries are converted to your time tracking system format as follows:
- **Description**: `Category: Description (Sub-Category)` 
- **Spent**: Hours from CSV
- **Date**: Timestamp from CSV (or current date)
- **Project**: Uses `TIME_TRACKING_PROJECT_ID` if set

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

## Troubleshooting

### macOS Security Issues

If you encounter "zsh: killed" or security warnings on macOS:

1. **Remove quarantine attribute** (most common fix):
   ```bash
   xattr -d com.apple.quarantine /path/to/timetrack
   ```

2. **If you get "cannot be opened because the developer cannot be verified"**:
   - Go to **System Preferences** → **Security & Privacy** → **General**
   - Click **"Allow Anyway"** next to the blocked app message
   - Or use command line: `sudo spctl --add /path/to/timetrack`

3. **Alternative: Run from Downloads folder first**:
   ```bash
   # Navigate to Downloads
   cd ~/Downloads
   
   # Remove quarantine and make executable
   xattr -d com.apple.quarantine time-tracker-9000-macos-arm64
   chmod +x time-tracker-9000-macos-arm64
   
   # Test run (this may trigger security dialog)
   ./time-tracker-9000-macos-arm64
   
   # After allowing in Security preferences, move to PATH
   sudo mv time-tracker-9000-macos-arm64 /usr/local/bin/timetrack
   ```

4. **If all else fails, use the source installation** (Option 2 above) which doesn't have signing issues.