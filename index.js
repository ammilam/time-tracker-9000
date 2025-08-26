#!/usr/bin/env node

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const inquirer = require('inquirer');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csv = require('csv-parser');
const { createReadStream } = require('fs');
const TimeTrackingClient = require('./time-tracking-client');
const ConfigManager = require('./config-manager');

class TimeTracker {
  constructor() {
    this.homeDir = os.homedir();
    this.timesheetsDir = path.join(this.homeDir, 'timesheets');
    this.configManager = new ConfigManager();
    this.config = null;
  }

  async loadConfig() {
    if (!this.config) {
      this.config = await this.configManager.loadConfig();
    }
    return this.config;
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
    const config = await this.loadConfig();
    
    if (!config) {
      console.log('⚠️  No configuration found. Using default prompts.');
      console.log('💡 Run configuration setup for customized categories.');
      return await this.promptForEntryDefault();
    }

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
      }
    ];

    // Add main category question based on config
    const mainCat = config.categories.mainCategory;
    if (mainCat.type === 'select') {
      questions.push({
        type: 'list',
        name: 'category',
        message: `${mainCat.label}:`,
        choices: mainCat.options
      });
    } else {
      questions.push({
        type: 'input',
        name: 'category',
        message: `${mainCat.label}:`,
        validate: (input) => {
          if (mainCat.required && !input.trim()) {
            return `${mainCat.label} is required`;
          }
          return true;
        }
      });
    }

    // Add description question
    questions.push({
      type: 'input',
      name: 'description',
      message: 'Description:',
      validate: (input) => {
        if (!input.trim()) {
          return 'Description is required';
        }
        return true;
      }
    });

    // Add sub category question based on config
    const subCat = config.categories.subCategory;
    if (subCat.type === 'select') {
      questions.push({
        type: 'list',
        name: 'subCategory',
        message: `${subCat.label}:`,
        choices: subCat.options,
        default: subCat.defaultValue || subCat.options[0]
      });
    } else {
      questions.push({
        type: 'input',
        name: 'subCategory',
        message: `${subCat.label} (press Enter for ${subCat.defaultValue || 'NA'}):`,
        default: subCat.defaultValue || 'NA'
      });
    }

    return await inquirer.prompt(questions);
  }

  async promptForEntryDefault() {
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
      const config = await this.loadConfig();
      
      return new Promise((resolve, reject) => {
        createReadStream(filePath)
          .pipe(csv())
          .on('data', (data) => {
            // Get field mappings from config if available
            const fieldMappings = config?.fieldMappings || {
              timestamp: ['Timestamp', 'timestamp', 'Day Period', 'Date'],
              hours: ['Hours', 'hours', 'Time Spent'],
              category: ['Category', 'category', 'Main Category', 'Type'],
              description: ['Description', 'description', 'Notes'],
              subCategory: ['Sub-Category', 'subCategory', 'Sub Category', 'Activity']
            };
            
            // Handle multiple CSV formats using field mappings
            const normalizedEntry = {};
            
            // Process each field using mappings
            Object.keys(fieldMappings).forEach(field => {
              const possibleHeaders = fieldMappings[field];
              for (const header of possibleHeaders) {
                if (data[header] !== undefined) {
                  normalizedEntry[field] = data[header];
                  break;
                }
              }
              if (normalizedEntry[field] === undefined) {
                normalizedEntry[field] = '';
              }
            });
            
            // Convert Day Period to timestamp if needed
            if (data['Day Period'] && !normalizedEntry.timestamp.includes('T')) {
              normalizedEntry.timestamp = `${data['Day Period']}T12:00:00.000Z`;
            }
            
            // Only add non-empty entries
            if (normalizedEntry.category && normalizedEntry.description) {
              entries.push(normalizedEntry);
            }
          })
          .on('end', () => resolve(entries))
          .on('error', reject);
      });
    } catch (error) {
      // File doesn't exist, return empty array
      return [];
    }
  }

  async writeToCSV(filePath, entries) {
    console.log(`Writing ${entries.length} entries to ${filePath}`);
    console.log('Entries to write:', JSON.stringify(entries, null, 2));
    
    const config = await this.loadConfig();
    let headers;
    
    if (config && config.customHeaders) {
      // Use custom headers from configuration
      headers = config.customHeaders;
    } else {
      // Use default format
      headers = [
        { id: 'timestamp', title: 'Timestamp' },
        { id: 'hours', title: 'Hours' },
        { id: 'category', title: 'Category' },
        { id: 'description', title: 'Description' },
        { id: 'subCategory', title: 'Sub-Category' }
      ];
    }
    
    const csvWriter = createCsvWriter({
      path: filePath,
      header: headers
    });

    // Transform entries for proper format
    const transformedEntries = entries.map(entry => {
      if (config && config.customTransform && typeof config.customTransform === 'function') {
        // Use custom transformation if provided in config
        return config.customTransform(entry);
      } else if (config && config.dateFormat === 'date-only') {
        // Use date-only format
        return {
          dayPeriod: entry.timestamp ? new Date(entry.timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          hours: entry.hours,
          category: entry.category,
          description: entry.description,
          subCategory: entry.subCategory
        };
      } else {
        return entry;
      }
    });

    await csvWriter.writeRecords(transformedEntries);
    console.log('CSV write completed');
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

  async showMainMenu() {
    const config = await this.loadConfig();
    const configStatus = config ? '✅' : '⚠️';
    
    const choices = [
      { name: '📝 Add new time entry', value: 'add' },
      { name: '📋 List CSV files', value: 'list' },
      { name: '👁️  View CSV file', value: 'view' },
      { name: '☁️  Upload to time tracking system', value: 'upload' },
      { name: '⚙️  Time tracking system settings', value: 'time-settings' },
      { name: `${configStatus} Category configuration`, value: 'config' },
      { name: '🚪 Exit', value: 'exit' }
    ];

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices
      }
    ]);

    return action;
  }

  async listCsvFiles() {
    try {
      const files = [];
      const years = await fs.readdir(this.timesheetsDir);
      
      for (const year of years) {
        const yearPath = path.join(this.timesheetsDir, year);
        const stat = await fs.stat(yearPath);
        if (!stat.isDirectory()) continue;
        
        const months = await fs.readdir(yearPath);
        for (const month of months) {
          const monthPath = path.join(yearPath, month);
          const monthStat = await fs.stat(monthPath);
          if (!monthStat.isDirectory()) continue;
          
          const csvFiles = await fs.readdir(monthPath);
          for (const file of csvFiles) {
            if (file.endsWith('.csv')) {
              const filePath = path.join(monthPath, file);
              const fileStat = await fs.stat(filePath);
              files.push({
                path: filePath,
                name: file,
                size: fileStat.size,
                modified: fileStat.mtime
              });
            }
          }
        }
      }
      
      files.sort((a, b) => b.modified - a.modified);
      
      if (files.length === 0) {
        console.log('\n📂 No CSV files found.');
        return [];
      }
      
      console.log('\n📂 CSV Files:');
      console.log('=============');
      files.forEach((file, index) => {
        console.log(`${index + 1}. ${file.name} (${(file.size / 1024).toFixed(1)}KB) - ${file.modified.toLocaleDateString()}`);
      });
      
      return files;
    } catch (error) {
      console.error('❌ Error listing files:', error.message);
      return [];
    }
  }

  async viewCsvFile() {
    const files = await this.listCsvFiles();
    if (files.length === 0) return;
    
    const { fileIndex } = await inquirer.prompt([
      {
        type: 'input',
        name: 'fileIndex',
        message: 'Enter file number to view:',
        validate: (input) => {
          const num = parseInt(input);
          if (isNaN(num) || num < 1 || num > files.length) {
            return `Please enter a number between 1 and ${files.length}`;
          }
          return true;
        }
      }
    ]);
    
    const selectedFile = files[parseInt(fileIndex) - 1];
    const entries = await this.readExistingEntries(selectedFile.path);
    
    console.log(`\n📄 Contents of ${selectedFile.name}:`);
    console.log('=' .repeat(50));
    
    if (entries.length === 0) {
      console.log('No entries found.');
      return;
    }
    
    let totalHours = 0;
    entries.forEach((entry, index) => {
      console.log(`${index + 1}. ${entry.hours}h - ${entry.category}: ${entry.description}`);
      if (entry.subCategory !== 'NA') {
        console.log(`   Sub-category: ${entry.subCategory}`);
      }
      console.log(`   Timestamp: ${new Date(entry.timestamp).toLocaleString()}`);
      console.log('');
      totalHours += parseFloat(entry.hours) || 0;
    });
    
    console.log(`Total hours: ${totalHours.toFixed(2)}`);
  }

  async uploadToTimeTrackingSystem() {
    if (!process.env.TIME_TRACKING_TOKEN || !process.env.TIME_TRACKING_URL) {
      console.log('❌ Time tracking system configuration missing. Please check your .env file.');
      return;
    }
    
    const client = new TimeTrackingClient(
      process.env.TIME_TRACKING_URL,
      process.env.TIME_TRACKING_TOKEN
    );
    
    console.log('🔍 Testing connection to time tracking system...');
    const connectionTest = await client.testConnection();
    if (!connectionTest.success) {
      console.log('❌ Failed to connect to time tracking system:', connectionTest.error);
      return;
    }
    console.log('✅ Connected to time tracking system successfully!');
    
    const files = await this.listCsvFiles();
    if (files.length === 0) return;
    
    const { fileIndex } = await inquirer.prompt([{
      type: 'input',
      name: 'fileIndex',
      message: 'Enter file number to upload:',
      validate: (input) => {
        const num = parseInt(input);
        if (isNaN(num) || num < 1 || num > files.length) {
          return `Please enter a number between 1 and ${files.length}`;
        }
        return true;
      }
    }]);
    
    const selectedFile = files[parseInt(fileIndex) - 1];
    const entries = await this.readExistingEntries(selectedFile.path);
    
    if (entries.length === 0) {
      console.log('❌ No entries found in selected file.');
      return;
    }
    
    console.log(`\n📤 Uploading ${entries.length} entries from ${selectedFile.name}...`);
    
    const config = await this.loadConfig();
    const results = await client.uploadTimeEntries(
      entries,
      process.env.TIME_TRACKING_PROJECT_ID,
      config
    );
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`\n📊 Upload Results:`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    
    if (failed > 0) {
      console.log('\n❌ Failed entries:');
      results.filter(r => !r.success).forEach(result => {
        console.log(`- ${result.entry.category}: ${result.entry.description} - ${result.result.error}`);
      });
    }
  }

  async configureTimeTrackingSystem() {
    console.log('\n⚙️  Time Tracking System Configuration');
    console.log('================================');
    console.log(`Current URL: ${process.env.TIME_TRACKING_URL || 'Not set'}`);
    console.log(`Token configured: ${process.env.TIME_TRACKING_TOKEN ? 'Yes' : 'No'}`);
    console.log(`Project ID: ${process.env.TIME_TRACKING_PROJECT_ID || 'Not set'}`);
    
    if (process.env.TIME_TRACKING_TOKEN && process.env.TIME_TRACKING_URL) {
      const client = new TimeTrackingClient(
        process.env.TIME_TRACKING_URL,
        process.env.TIME_TRACKING_TOKEN
      );
      
      console.log('\n🔍 Testing connection...');
      const connectionTest = await client.testConnection();
      if (connectionTest.success) {
        console.log('✅ Connection successful!');
        
        console.log('\n📋 Available projects:');
        const projectsResult = await client.getProjects();
        if (projectsResult.success) {
          projectsResult.data.forEach(project => {
            console.log(`- ${project.Id}: ${project.Name}`);
          });
        }
      } else {
        console.log('❌ Connection failed:', connectionTest.error);
      }
    }
    
    console.log('\n💡 To configure your time tracking system, edit your .env file with:');
    console.log('TIME_TRACKING_URL=https://your-timetracking-system.com/api/v2/');
    console.log('TIME_TRACKING_TOKEN=your_base64_encoded_token');
    console.log('TIME_TRACKING_PROJECT_ID=optional_default_project_id_or_name');
  }

  async manageCategoryConfig() {
    console.log('\n🔧 Category Configuration Management');
    console.log('===================================');
    
    const configExists = await this.configManager.configExists();
    const config = await this.loadConfig();
    
    if (config) {
      console.log(`Current organization: ${config.organization}`);
      console.log(`Main category: ${config.categories.mainCategory.label} (${config.categories.mainCategory.options.length} options)`);
      console.log(`Sub category: ${config.categories.subCategory.label} (${config.categories.subCategory.options.length} options)`);
    }
    
    const choices = [];
    
    if (!configExists) {
      choices.push({ name: '🆕 Initialize configuration', value: 'init' });
    } else {
      choices.push(
        { name: '📝 Edit configuration', value: 'edit' },
        { name: '✅ Validate configuration', value: 'validate' },
        { name: '🔄 Reinitialize configuration', value: 'reinit' }
      );
    }
    
    choices.push({ name: '🚪 Back to main menu', value: 'back' });
    
    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: 'Configuration action:',
      choices
    }]);
    
    switch (action) {
      case 'init':
      case 'reinit':
        await this.configManager.initializeConfig();
        this.config = null; // Force reload
        break;
        
      case 'edit':
        await this.configManager.editConfig();
        this.config = null; // Force reload
        break;
        
      case 'validate':
        await this.configManager.validateConfig();
        break;
        
      case 'back':
        return;
    }
  }

  async run() {
    try {
      console.log('🕐 Time Tracker 9000');
      console.log('===================');
      
      // Initialize timesheets directory
      await this.initializeTimesheetsDirectory();
      
      while (true) {
        const action = await this.showMainMenu();
        
        switch (action) {
          case 'add':
            const entry = await this.promptForEntry();
            await this.addEntry(entry);
            console.log('\n✅ Time entry recorded successfully!');
            break;
            
          case 'list':
            await this.listCsvFiles();
            break;
            
          case 'view':
            await this.viewCsvFile();
            break;
            
          case 'upload':
            await this.uploadToTimeTrackingSystem();
            break;
            
          case 'time-settings':
            await this.configureTimeTrackingSystem();
            break;
            
          case 'config':
            await this.manageCategoryConfig();
            break;
            
          case 'exit':
            console.log('\n👋 Goodbye!');
            return;
        }
        
        // Wait for user to press enter before showing menu again
        await inquirer.prompt([{
          type: 'input',
          name: 'continue',
          message: 'Press Enter to continue...'
        }]);
        console.clear();
      }
      
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