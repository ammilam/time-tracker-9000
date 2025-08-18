# Time Tracker 9000

A command-line time tracking application that helps you log work hours with detailed categorization. Available as standalone executables for Linux, macOS, and Windows - no Node.js installation required!

## Features

- **Automatic Directory Structure**: Creates `~/timesheets/YYYY/MM/` directory structure
- **Daily CSV Files**: Generates CSV files named `YYYY-MM-DD.csv` for each day
- **Interactive Prompts**: Guides you through entering time entries
- **Smart Updates**: Updates existing entries when category and description match
- **Cross-Platform**: Standalone executables for Linux, macOS (Intel & ARM), and Windows
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

> **⚠️ macOS Users**: The binaries are unsigned, so you'll need to bypass Gatekeeper security. Follow the macOS instructions below carefully.

3. Extract the archive and move the binary to your PATH:

   **Linux:**
   ```bash
   # Extract the archive
   tar -xzf time-tracker-9000-linux-x64.tar.gz
   
   # Move to a directory in your PATH (requires sudo)
   sudo mv time-tracker-9000-linux-x64 /usr/local/bin/timetrack
   
   # Make executable (if needed)
   sudo chmod +x /usr/local/bin/timetrack
   ```

   **macOS:**
   ```bash
   # Extract the archive (choose your architecture)
   tar -xzf time-tracker-9000-macos-arm64.tar.gz  # Apple Silicon (M1/M2/M3)
   # OR
   tar -xzf time-tracker-9000-macos-x64.tar.gz    # Intel

   # Move to a directory in your PATH
   sudo mv time-tracker-9000-macos-* /usr/local/bin/timetrack
   
   # Make executable
   sudo chmod +x /usr/local/bin/timetrack
   
   # IMPORTANT: Remove quarantine attribute (macOS security)
   sudo xattr -d com.apple.quarantine /usr/local/bin/timetrack
   
   # If you still get security warnings, run once:
   sudo spctl --add /usr/local/bin/timetrack
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