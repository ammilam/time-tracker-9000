const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const inquirer = require('inquirer');

class ConfigManager {
  constructor() {
    this.homeDir = os.homedir();
    this.configPath = path.join(this.homeDir, '.timetracker-config.json');
    this.defaultConfig = {
      version: "1.0.0",
      organization: "Default Organization",
      categories: {
        mainCategory: {
          label: "Main Category",
          type: "select", // select, input, or fixed
          options: [
            "Development",
            "Testing", 
            "Documentation",
            "Meetings",
            "Support"
          ],
          required: true
        },
        subCategory: {
          label: "Sub Category", 
          type: "select",
          options: [
            "Frontend",
            "Backend", 
            "Database",
            "DevOps",
            "Research"
          ],
          required: false,
          defaultValue: "NA"
        }
      },
      timeTracking: {
        fieldMappings: {
          mainCategory: "Category",
          subCategory: "Sub-Category",
          description: "Description",
          hours: "Spent"
        },
        descriptionTemplate: "{category}: {description}{subCategory ? ` (${subCategory})` : ''}"
      }
    };
    
    // Enterprise configuration template
    this.enterpriseConfig = {
      version: "1.0.0", 
      organization: "Enterprise",
      categories: {
        mainCategory: {
          label: "Category",
          type: "select",
          options: [
            "Development",
            "Testing",
            "Analysis", 
            "Documentation",
            "Meetings",
            "Support",
            "Training"
          ],
          required: true
        },
        subCategory: {
          label: "Activity",
          type: "select", 
          options: [
            "Code Development",
            "Code Review",
            "Unit Testing",
            "Integration Testing",
            "Requirements Analysis",
            "Technical Documentation",
            "User Documentation", 
            "Team Meetings",
            "Client Meetings",
            "Bug Fixes",
            "Performance Optimization",
            "Security Review"
          ],
          required: true,
          defaultValue: "Code Development"
        }
      },
      timeTracking: {
        fieldMappings: {
          mainCategory: "Category",
          subCategory: "Activity", 
          description: "Description",
          hours: "Spent"
        },
        descriptionTemplate: "{description} [{mainCategory}: {category}, {subCategory}: {subCategory}]"
      }
    };
  }

  async configExists() {
    try {
      await fs.access(this.configPath);
      return true;
    } catch {
      return false;
    }
  }

  async loadConfig() {
    try {
      if (await this.configExists()) {
        const configData = await fs.readFile(this.configPath, 'utf8');
        return JSON.parse(configData);
      }
      return null;
    } catch (error) {
      console.error('❌ Error loading config:', error.message);
      return null;
    }
  }

  async saveConfig(config) {
    try {
      await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
      console.log(`✅ Configuration saved to ${this.configPath}`);
      return true;
    } catch (error) {
      console.error('❌ Error saving config:', error.message);
      return false;
    }
  }

  async initializeConfig() {
    console.log('\n🔧 Time Tracker Configuration Setup');
    console.log('===================================');
    
    if (await this.configExists()) {
      const { overwrite } = await inquirer.prompt([{
        type: 'confirm',
        name: 'overwrite',
        message: 'Configuration file already exists. Overwrite?',
        default: false
      }]);
      
      if (!overwrite) {
        console.log('Configuration initialization cancelled.');
        return false;
      }
    }

    const { configType } = await inquirer.prompt([{
      type: 'list',
      name: 'configType',
      message: 'Select configuration template:',
      choices: [
        { name: '🏢 Enterprise (Category + Activity)', value: 'enterprise' },
        { name: '🔧 Default (Generic categories)', value: 'default' },
        { name: '✏️  Custom (Configure manually)', value: 'custom' }
      ]
    }]);

    let config;
    switch (configType) {
      case 'enterprise':
        config = { ...this.enterpriseConfig };
        break;
      case 'default':
        config = { ...this.defaultConfig };
        break;
      case 'custom':
        config = await this.createCustomConfig();
        break;
    }

    if (config) {
      await this.saveConfig(config);
      console.log('\n📋 Configuration Summary:');
      console.log(`Organization: ${config.organization}`);
      console.log(`Main Category: ${config.categories.mainCategory.label}`);
      console.log(`Sub Category: ${config.categories.subCategory.label}`);
      return true;
    }
    
    return false;
  }

  async createCustomConfig() {
    console.log('\n✏️ Custom Configuration Setup');
    
    const { organization } = await inquirer.prompt([{
      type: 'input',
      name: 'organization',
      message: 'Organization name:',
      default: 'My Organization'
    }]);

    const { mainCategoryLabel } = await inquirer.prompt([{
      type: 'input', 
      name: 'mainCategoryLabel',
      message: 'Main category field label:',
      default: 'Category'
    }]);

    const { subCategoryLabel } = await inquirer.prompt([{
      type: 'input',
      name: 'subCategoryLabel', 
      message: 'Sub category field label:',
      default: 'Sub-Category'
    }]);

    // Get main category options
    const mainOptions = [];
    console.log('\nEnter main category options (press Enter with empty value to finish):');
    while (true) {
      const { option } = await inquirer.prompt([{
        type: 'input',
        name: 'option',
        message: `Main category option ${mainOptions.length + 1}:`
      }]);
      
      if (!option.trim()) break;
      mainOptions.push(option.trim());
    }

    // Get sub category options  
    const subOptions = [];
    console.log('\nEnter sub category options (press Enter with empty value to finish):');
    while (true) {
      const { option } = await inquirer.prompt([{
        type: 'input', 
        name: 'option',
        message: `Sub category option ${subOptions.length + 1}:`
      }]);
      
      if (!option.trim()) break;
      subOptions.push(option.trim());
    }

    return {
      version: "1.0.0",
      organization,
      categories: {
        mainCategory: {
          label: mainCategoryLabel,
          type: "select",
          options: mainOptions.length > 0 ? mainOptions : ["General"],
          required: true
        },
        subCategory: {
          label: subCategoryLabel,
          type: "select", 
          options: subOptions.length > 0 ? subOptions : ["NA"],
          required: false,
          defaultValue: subOptions.length > 0 ? subOptions[0] : "NA"
        }
      },
      timeTracking: {
        fieldMappings: {
          mainCategory: mainCategoryLabel,
          subCategory: subCategoryLabel,
          description: "Description", 
          hours: "Spent"
        },
        descriptionTemplate: "{description} [{mainCategory}: {category}, {subCategory}: {subCategory}]"
      }
    };
  }

  async editConfig() {
    const config = await this.loadConfig();
    if (!config) {
      console.log('❌ No configuration found. Run initialization first.');
      return false;
    }

    console.log('\n📝 Edit Configuration');
    console.log('====================');
    console.log('Current configuration:');
    console.log(JSON.stringify(config, null, 2));
    
    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: 'What would you like to edit?',
      choices: [
        { name: '🏢 Organization name', value: 'org' },
        { name: '📂 Main category options', value: 'main' },
        { name: '📁 Sub category options', value: 'sub' },
        { name: '🔄 Reinitialize completely', value: 'reinit' },
        { name: '🚪 Back to menu', value: 'back' }
      ]
    }]);

    switch (action) {
      case 'org':
        const { newOrg } = await inquirer.prompt([{
          type: 'input',
          name: 'newOrg',
          message: 'New organization name:',
          default: config.organization
        }]);
        config.organization = newOrg;
        await this.saveConfig(config);
        break;
        
      case 'main':
        await this.editCategoryOptions(config, 'mainCategory');
        break;
        
      case 'sub':
        await this.editCategoryOptions(config, 'subCategory');
        break;
        
      case 'reinit':
        await this.initializeConfig();
        return true;
        
      case 'back':
        return false;
    }
    
    return true;
  }

  async editCategoryOptions(config, categoryType) {
    const category = config.categories[categoryType];
    console.log(`\nCurrent ${category.label} options:`);
    category.options.forEach((opt, i) => console.log(`${i + 1}. ${opt}`));
    
    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action', 
      message: `Edit ${category.label} options:`,
      choices: [
        { name: '➕ Add option', value: 'add' },
        { name: '❌ Remove option', value: 'remove' },
        { name: '🔄 Replace all options', value: 'replace' }
      ]
    }]);

    switch (action) {
      case 'add':
        const { newOption } = await inquirer.prompt([{
          type: 'input',
          name: 'newOption',
          message: `New ${category.label} option:`
        }]);
        if (newOption.trim()) {
          category.options.push(newOption.trim());
          await this.saveConfig(config);
        }
        break;
        
      case 'remove':
        if (category.options.length <= 1) {
          console.log('❌ Cannot remove the last option.');
          break;
        }
        const { removeIndex } = await inquirer.prompt([{
          type: 'list',
          name: 'removeIndex',
          message: 'Select option to remove:',
          choices: category.options.map((opt, i) => ({ name: opt, value: i }))
        }]);
        category.options.splice(removeIndex, 1);
        await this.saveConfig(config);
        break;
        
      case 'replace':
        const newOptions = [];
        console.log(`\nEnter new ${category.label} options (press Enter with empty value to finish):`);
        while (true) {
          const { option } = await inquirer.prompt([{
            type: 'input',
            name: 'option',
            message: `Option ${newOptions.length + 1}:`
          }]);
          
          if (!option.trim()) break;
          newOptions.push(option.trim());
        }
        
        if (newOptions.length > 0) {
          category.options = newOptions;
          await this.saveConfig(config);
        }
        break;
    }
  }

  async validateConfig() {
    const config = await this.loadConfig();
    if (!config) {
      console.log('❌ No configuration found.');
      return false;
    }

    console.log('\n✅ Configuration validation:');
    console.log(`Organization: ${config.organization}`);
    console.log(`Version: ${config.version}`);
    console.log(`Main Category (${config.categories.mainCategory.label}): ${config.categories.mainCategory.options.length} options`);
    console.log(`Sub Category (${config.categories.subCategory.label}): ${config.categories.subCategory.options.length} options`);
    
    return true;
  }
}

module.exports = ConfigManager;
