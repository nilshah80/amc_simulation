const crypto = require('crypto');

class Utils {
  // Generate PAN number (format: ABCDE1234F)
  static generatePAN() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    
    let pan = '';
    // First 5 letters
    for (let i = 0; i < 5; i++) {
      pan += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    // 4 digits
    for (let i = 0; i < 4; i++) {
      pan += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    // Last letter
    pan += letters.charAt(Math.floor(Math.random() * letters.length));
    
    return pan;
  }

  // Generate folio number (format: 12345678/01)
  static generateFolioNumber(customerId) {
    const timestamp = Date.now().toString().slice(-8);
    const customerPart = customerId.toString().padStart(2, '0');
    return `${timestamp}/${customerPart}`;
  }

  // Generate transaction ID (format: TXN202505241234567890)
  static generateTransactionId() {
    const date = new Date();
    const dateStr = date.getFullYear().toString() + 
                   (date.getMonth() + 1).toString().padStart(2, '0') + 
                   date.getDate().toString().padStart(2, '0');
    const randomNum = Math.floor(Math.random() * 1000000000).toString().padStart(10, '0');
    return `TXN${dateStr}${randomNum}`;
  }

  // Generate SIP ID (format: SIP202505241234567)
  static generateSipId() {
    const date = new Date();
    const dateStr = date.getFullYear().toString() + 
                   (date.getMonth() + 1).toString().padStart(2, '0') + 
                   date.getDate().toString().padStart(2, '0');
    const randomNum = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
    return `SIP${dateStr}${randomNum}`;
  }

  // Generate scheme code (format: ABC001)
  static generateSchemeCode(category) {
    const categoryCode = category.substring(0, 3).toUpperCase();
    const randomNum = Math.floor(Math.random() * 999) + 1;
    return `${categoryCode}${randomNum.toString().padStart(3, '0')}`;
  }

  // Generate CAMS reference number
  static generateCamsReference() {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `CAMS${timestamp}${random}`;
  }

  // Validate PAN format
  static isValidPAN(pan) {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan);
  }

  // Calculate age from date of birth
  static calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  // Generate random amount within range
  static generateRandomAmount(min, max) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(2));
  }

  // Calculate units based on amount and NAV
  static calculateUnits(amount, nav) {
    return parseFloat((amount / nav).toFixed(6));
  }

  // Calculate current value of holdings
  static calculateCurrentValue(units, nav) {
    return parseFloat((units * nav).toFixed(2));
  }

  // Add business days to a date
  static addBusinessDays(date, days) {
    const result = new Date(date);
    let addedDays = 0;
    
    while (addedDays < days) {
      result.setDate(result.getDate() + 1);
      const dayOfWeek = result.getDay();
      
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        addedDays++;
      }
    }
    
    return result;
  }

  // Get next SIP execution date
  static getNextSipExecutionDate(frequency, currentDate = new Date()) {
    const date = new Date(currentDate);
    
    switch (frequency) {
      case 'MONTHLY':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'QUARTERLY':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'YEARLY':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        date.setMonth(date.getMonth() + 1); // Default to monthly
    }
    
    return date;
  }

  // Generate random Indian name
  static generateRandomName() {
    const firstNames = [
      'Amit', 'Priya', 'Rahul', 'Sneha', 'Vikram', 'Anita', 'Rajesh', 'Pooja',
      'Suresh', 'Kavita', 'Arun', 'Meera', 'Deepak', 'Sunita', 'Manoj', 'Rekha',
      'Sanjay', 'Geeta', 'Ashok', 'Shanti', 'Ravi', 'Uma', 'Vinod', 'Lata'
    ];
    
    const lastNames = [
      'Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Agarwal', 'Jain', 'Mehta',
      'Shah', 'Reddy', 'Nair', 'Iyer', 'Chopra', 'Bansal', 'Verma', 'Malhotra',
      'Sinha', 'Joshi', 'Mishra', 'Pandey', 'Rao', 'Bhatt', 'Kulkarni', 'Desai'
    ];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    return { firstName, lastName };
  }

  // Generate random email
  static generateEmail(firstName, lastName) {
    const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const randomNum = Math.floor(Math.random() * 1000);
    
    return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomNum}@${domain}`;
  }

  // Generate random phone number
  static generatePhoneNumber() {
    const prefixes = ['9', '8', '7', '6'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    let number = prefix;
    
    for (let i = 0; i < 9; i++) {
      number += Math.floor(Math.random() * 10);
    }
    
    return number;
  }

  // Get random risk profile
  static getRandomRiskProfile() {
    const profiles = ['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE'];
    return profiles[Math.floor(Math.random() * profiles.length)];
  }

  // Get random transaction type
  static getRandomTransactionType() {
    const types = ['SIP', 'LUMPSUM', 'STP', 'REDEMPTION'];
    const weights = [0.4, 0.3, 0.2, 0.1]; // SIP most common
    
    const random = Math.random();
    let sum = 0;
    
    for (let i = 0; i < weights.length; i++) {
      sum += weights[i];
      if (random <= sum) {
        return types[i];
      }
    }
    
    return types[0]; // fallback
  }

  // Format currency for display
  static formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  }

  // Format date for display
  static formatDate(date) {
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date(date));
  }

  // Deep clone object
  static deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // Sleep utility for async operations
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Random delay between min and max ms
  static randomDelay(min = 1000, max = 5000) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return this.sleep(delay);
  }

  // Generate random boolean with probability
  static randomBoolean(probability = 0.5) {
    return Math.random() < probability;
  }

  // Get random element from array
  static getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  // Shuffle array
  static shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

module.exports = Utils;
