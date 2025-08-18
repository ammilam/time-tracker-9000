#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const inquirer = require('inquirer');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csv = require('csv-parser');
const { createReadStream } = require('fs');

class TimeTracker {
  constructor() {
    this.homeDir = os.homedir();
    this.timesheetsDir = path.join(this.homeDir, 'timesheets');
  }

  async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch (error) {
      await fs.mkdir(dirPath, { recursive: true });
      console.log(`Created directory: ${dirPath}`);
    }
  }

  async initializeTimesheetsDirectory() {
    await this.ensureDirectoryExists(this.timesheetsDir);
  }

  getCurrentDate() {
    const now = new Date();
    return {
      year: now.getFullYear().toString(),
      month: (now.getMonth() + 1).toString().padStart(2, '0'),
      day: now.getDate().toString().padStart(2, '0'),
      date: now.toISOString().split('T')[0]
    };
  }

  getFilePath() {
    const { year, month, day } = this.getCurrentDate();
    const yearDir = path.join(this.timesheetsDir, year);
    const monthDir = path.join(yearDir, month);
    const fileName = `${year}-${month}-${day}.csv`;
    
    return {
      yearDir,
      monthDir,
      filePath: path.join(monthDir, fileName)
    };
  }

  async promptForEntry() {
    const questions = [
      {
        type: 'input',
        name: 'hours',
        message: 'Hours (float):',
        validate: (input) => {
          const num = parseFloat(input);
          if (isNaN(num) || num <= 0) {
            return 'Please enter a valid positive number for hours';
          }
          return true;
        },
        filter: (input) => parseFloat(input)
      },
      {
        type: 'input',
        name: 'category',
        message: 'Category:',
        validate: (input) => {
          if (!input.trim()) {
            return 'Category is required';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'description',
        message: 'Description:',
        validate: (input) => {
          if (!input.trim()) {
            return 'Description is required';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'subCategory',
        message: 'Sub-category (press Enter for NA):',
        default: 'NA'
      }
    ];

    return await inquirer.prompt(questions);
  }

  async readExistingEntries(filePath) {
    const entries = [];
    
    try {
      await fs.access(filePath);
      
      return new Promise((resolve, reject) => {
        createReadStream(filePath)
          .pipe(csv())
          .on('data', (data) => entries.push(data))
          .on('end', () => resolve(entries))
          .on('error', reject);
      });
    } catch (error) {
      // File doesn't exist, return empty array
      return [];
    }
  }

  async writeToCSV(filePath, entries) {
    const csvWriter = createCsvWriter({
      path: filePath,
      header: [
        { id: 'timestamp', title: 'Timestamp' },
        { id: 'hours', title: 'Hours' },
        { id: 'category', title: 'Category' },
        { id: 'description', title: 'Description' },
        { id: 'subCategory', title: 'Sub-Category' }
      ]
    });

    await csvWriter.writeRecords(entries);
  }

  async addEntry(entry) {
    const { yearDir, monthDir, filePath } = this.getFilePath();
    
    // Ensure year and month directories exist
    await this.ensureDirectoryExists(yearDir);
    await this.ensureDirectoryExists(monthDir);

    // Read existing entries
    const existingEntries = await this.readExistingEntries(filePath);

    // Add timestamp to new entry
    const newEntry = {
      timestamp: new Date().toISOString(),
      ...entry
    };

    // Check if there's an existing entry with the same category and description
    const existingIndex = existingEntries.findIndex(
      e => e.category === entry.category && e.description === entry.description
    );

    if (existingIndex !== -1) {
      // Update existing entry by adding hours
      const existingHours = parseFloat(existingEntries[existingIndex].hours) || 0;
      existingEntries[existingIndex].hours = (existingHours + entry.hours).toString();
      existingEntries[existingIndex].timestamp = newEntry.timestamp;
      console.log(`Updated existing entry. Total hours: ${existingEntries[existingIndex].hours}`);
    } else {
      // Add new entry
      existingEntries.push(newEntry);
      console.log('Added new entry');
    }

    // Write all entries back to CSV
    await this.writeToCSV(filePath, existingEntries);
    
    const { date } = this.getCurrentDate();
    console.log(`Entry saved to: ${filePath}`);
    console.log(`Date: ${date}`);
    console.log(`Hours: ${entry.hours}`);
    console.log(`Category: ${entry.category}`);
    console.log(`Description: ${entry.description}`);
    console.log(`Sub-Category: ${entry.subCategory}`);
  }

  async run() {
    try {
      console.log('🕐 Time Tracker 9000');
      console.log('===================');
      
      // Initialize timesheets directory
      await this.initializeTimesheetsDirectory();
      
      // Prompt for entry
      const entry = await this.promptForEntry();
      
      // Add entry to CSV
      await this.addEntry(entry);
      
      console.log('\n✅ Time entry recorded successfully!');
      
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }
}

// Run the application
if (require.main === module) {
  const tracker = new TimeTracker();
  tracker.run();
}

module.exports = TimeTracker;
