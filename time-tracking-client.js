const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class TimeTrackingClient {
  constructor(baseUrl, token) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.token = token;
    
    // Handle both v1 and v2 API endpoints
    const apiVersion = this.baseUrl.includes('/api/v2') ? '' : '/api/v1';
    const finalBaseUrl = this.baseUrl.includes('/api/') ? this.baseUrl : `${this.baseUrl}${apiVersion}`;
    
    this.client = axios.create({
      baseURL: finalBaseUrl,
      headers: {
        'Authorization': `Basic ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }
  
  async testConnection() {
    try {
      const response = await this.client.get('/Context');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  async getProjects() {
    try {
      const response = await this.client.get('/Projects?take=100&where=IsActive eq true&orderBy=Name');
      return {
        success: true,
        data: response.data.Items || response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  async createTimeEntry(timeEntry) {
    try {
      const response = await this.client.post('/Times', timeEntry);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.Message || error.message
      };
    }
  }
  
  async uploadTimeEntries(entries, projectId, config) {
    const results = [];
    
    for (const entry of entries) {
      try {
        // Skip entries with 0 hours
        if (!entry.hours || parseFloat(entry.hours) <= 0) {
          results.push({
            entry: entry,
            result: { success: false, error: 'Zero or invalid hours' },
            success: false
          });
          continue;
        }
        
        // Convert timestamp to date
        let date = new Date();
        if (entry.timestamp) {
          date = new Date(entry.timestamp);
        }
        
        // Format date for API
        const formattedDate = date.toISOString().split('T')[0];
        
        // Create time entry object
        const timeEntry = {
          Date: formattedDate,
          Spent: parseFloat(entry.hours),
          Description: entry.description
        };
        
        // Add project if specified
        if (projectId) {
          // Handle both numeric IDs and string project names
          if (isNaN(projectId)) {
            timeEntry.Project = { Name: projectId };
          } else {
            timeEntry.Project = { Id: parseInt(projectId) };
          }
        }

        // Add custom fields based on configuration
        if (config && config.timeTracking && config.timeTracking.fieldMappings) {
          const mappings = config.timeTracking.fieldMappings;
          
          if (mappings.mainCategory && mappings.mainCategory !== 'Description') {
            timeEntry[mappings.mainCategory] = { Name: entry.category };
          }
          
          if (mappings.subCategory && mappings.subCategory !== 'Description') {
            timeEntry[mappings.subCategory] = entry.subCategory;
          }
        }

        const result = await this.createTimeEntry(timeEntry);
        results.push({
          entry: entry,
          result: result,
          success: result.success
        });
        
      } catch (error) {
        results.push({
          entry: entry,
          result: { success: false, error: error.message },
          success: false
        });
      }
    }
    
    return results;
  }
  
  async bulkUploadFromCSV(filePath, projectId, config) {
    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      const entries = this.parseCSV(fileContent);
      return await this.uploadTimeEntries(entries, projectId, config);
    } catch (error) {
      return [{
        entry: null,
        result: { success: false, error: error.message },
        success: false
      }];
    }
  }
  
  parseCSV(csvContent) {
    // Simple CSV parser - in real app would use a proper CSV parser
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const entries = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',').map(v => v.trim());
      const entry = {};
      
      headers.forEach((header, index) => {
        entry[header] = values[index] || '';
      });
      
      entries.push(entry);
    }
    
    return entries;
  }
}

module.exports = TimeTrackingClient;
