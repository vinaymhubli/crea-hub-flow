/**
 * Chat monitoring utility to prevent users from exchanging
 * phone numbers and email addresses in chat conversations.
 * 
 * Enhanced to detect:
 * - Written numbers (one, two, three, onetwothree)
 * - Misspelled emails (at for @, dot for .)
 * - Patterns across multiple messages
 * - Single digits/characters sent sequentially
 */

export interface ContactInfoCheckResult {
  hasContactInfo: boolean;
  detectedEmails: string[];
  detectedPhones: string[];
  message: string;
  suspiciousPattern?: string;
  isTemporarilyBlocked?: boolean;
  blockTimeRemaining?: number; // milliseconds remaining in block
}

// Store recent messages per conversation/session for pattern detection
const recentMessageHistory: Map<string, Array<{ content: string; timestamp: number; senderId: string }>> = new Map();
const MAX_HISTORY_MESSAGES = 10;
const MAX_HISTORY_TIME_MS = 5 * 60 * 1000; // 5 minutes

// Track violations and temporary blocks per user per context
interface UserBlock {
  violationCount: number;
  blockedUntil: number; // timestamp when block expires
}

const userBlocks: Map<string, UserBlock> = new Map(); // key: `${contextId}_${senderId}`

// Block durations in milliseconds (progressive: 1min, 5min, 15min, 30min)
const BLOCK_DURATIONS = [
  1 * 60 * 1000,   // 1 minute for first violation
  5 * 60 * 1000,   // 5 minutes for second violation
  15 * 60 * 1000,  // 15 minutes for third violation
  30 * 60 * 1000,  // 30 minutes for fourth+ violations
];

const VIOLATION_RESET_TIME = 30 * 60 * 1000; // Reset violation count after 30 minutes

// Number word mappings
const NUMBER_WORDS: { [key: string]: string } = {
  'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
  'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
  'oh': '0', 'o': '0', // common substitutions
  'won': '1', 'too': '2', 'to': '2', 'for': '4', 'ate': '8'
};

// Common email/phone misspellings and obfuscations
const EMAIL_PATTERNS = [
  /(\w+)\s*(?:at|@|AT|att|aatt)\s*(\w+)\s*(?:dot|\.|doht|dt|dott)\s*(\w+)/gi,
  /(\w+)\s*(?:at|@)\s*(\w+)\s*(?:dot|\.)\s*(\w+)\s*(?:dot|\.)?\s*(\w+)?/gi,
  /\b(\w+(?:\.|dot)\w+)\s*(?:at|@)\s*(\w+)\s*(?:dot|\.)\s*(\w+)/gi,
];

const PHONE_WORD_PATTERNS = [
  /(?:call|phone|number|reach|contact|text|sms|whatsapp|telegram)\s*[:\-]?\s*([a-z\s]+(?:one|two|three|four|five|six|seven|eight|nine|zero|\d)[a-z\s\d]+)/gi,
];

/**
 * Converts written numbers to digits
 * Handles: "one two three", "onetwothree", "one-two-three", etc.
 */
function convertWordsToNumbers(text: string): string {
  let converted = text.toLowerCase();
  
  // Replace number words with digits
  Object.keys(NUMBER_WORDS).forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    converted = converted.replace(regex, NUMBER_WORDS[word]);
  });
  
  return converted;
}

/**
 * Detects email addresses in text including misspellings and obfuscations
 * Matches:
 * - Standard: user@domain.com
 * - With words: user at domain dot com
 * - Misspelled: user att domain doht com
 */
function detectEmails(text: string): string[] {
  const emails: string[] = [];
  
  // Standard email pattern
  const standardRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const standardMatches = text.match(standardRegex) || [];
  emails.push(...standardMatches);
  
  // Check for obfuscated emails with "at" and "dot"
  EMAIL_PATTERNS.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[2] && match[3]) {
        // Reconstruct email-like pattern
        const emailLike = `${match[1]}@${match[2]}.${match[3]}${match[4] ? '.' + match[4] : ''}`;
        // Basic validation - at least looks like email
        if (emailLike.includes('@') && emailLike.includes('.')) {
          emails.push(emailLike);
        }
      }
    }
  });
  
  // Check for split email patterns (e.g., "my email is john", "then at", "gmail dot com")
  const lowerText = text.toLowerCase();
  const emailSplitPattern = /\b(email|mail|contact|reach|message)\s+(?:me|us|at|is|@)\s*([a-z0-9._-]+)\s*(?:at|@)\s*([a-z0-9.-]+)\s*(?:dot|\.)\s*([a-z]{2,})/gi;
  const splitMatches = text.matchAll(emailSplitPattern);
  for (const match of splitMatches) {
    if (match[2] && match[3] && match[4]) {
      emails.push(`${match[2]}@${match[3]}.${match[4]}`);
    }
  }
  
  return [...new Set(emails)]; // Remove duplicates
}

/**
 * Detects phone numbers in various formats including written numbers
 * Handles:
 * - Standard formats: +1-234-567-8900, (123) 456-7890
 * - Written numbers: "one two three four five six seven eight nine zero"
 * - Combined: "call me at one two three..."
 */
function detectPhoneNumbers(text: string): string[] {
  const phones: string[] = [];
  
  // Standard phone patterns
  const phonePatterns = [
    /\+\d{1,3}[\s.-]?\d{1,4}[\s.-]?\d{1,4}[\s.-]?\d{4,}/g,
    /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g,
    /[6-9]\d{9}/g,
    /\d{3,}[\s.-]?\d{3,}[\s.-]?\d{3,}/g,
  ];

  phonePatterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    phones.push(...matches);
  });

  // Convert text to check for written numbers
  const convertedText = convertWordsToNumbers(text);
  
  // Extract sequences of digits from converted text
  const writtenPhonePatterns = [
    /\b(\d[\d\s.-]{6,})\b/g, // 7+ digits with spaces/dashes
    /(?:phone|call|number|contact|reach|text|sms|whatsapp)\s*[:\-]?\s*([\d\s.-]{7,})/gi,
    /(?:is|my|the)\s+(?:number|phone)\s+is?\s*[:\-]?\s*([\d\s.-]{7,})/gi,
  ];
  
  writtenPhonePatterns.forEach(pattern => {
    const matches = convertedText.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        const digitsOnly = match[1].replace(/\D/g, '');
        if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
          phones.push(match[1].trim());
        }
      }
    }
  });

  // Check for patterns like "one two three" directly
  const wordsText = text.toLowerCase();
  const wordSequencePattern = /\b(?:one|two|three|four|five|six|seven|eight|nine|zero|oh|\d)(?:\s+|-)?(?:one|two|three|four|five|six|seven|eight|nine|zero|oh|\d)(?:\s+|-)?(?:one|two|three|four|five|six|seven|eight|nine|zero|oh|\d)(?:\s+|-)?(?:one|two|three|four|five|six|seven|eight|nine|zero|oh|\d)(?:\s+|-)?(?:one|two|three|four|five|six|seven|eight|nine|zero|oh|\d)(?:\s+|-)?(?:one|two|three|four|five|six|seven|eight|nine|zero|oh|\d)(?:\s+|-)?(?:one|two|three|four|five|six|seven|eight|nine|zero|oh|\d)+/gi;
  const wordMatches = wordsText.matchAll(wordSequencePattern);
  for (const match of wordMatches) {
    if (match[0]) {
      const converted = convertWordsToNumbers(match[0]);
      const digitsOnly = converted.replace(/\D/g, '');
      if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
        phones.push(match[0].trim());
      }
    }
  }

  // Filter out false positives (like years, zip codes, etc.)
  // Phone numbers should be between 7-15 digits total
  const validPhones = phones.filter(phone => {
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length >= 7 && digitsOnly.length <= 15;
  });

  // Remove duplicates
  return [...new Set(validPhones)];
}

/**
 * Detects suspicious patterns where contact info might be split across messages
 * Checks recent message history for patterns like single digits/characters
 */
function detectSuspiciousPattern(
  currentMessage: string,
  contextId: string,
  senderId: string
): { suspicious: boolean; pattern?: string } {
  // Get recent messages from this conversation/session
  const history = recentMessageHistory.get(contextId) || [];
  const recentFromSender = history.filter(
    msg => msg.senderId === senderId && 
    Date.now() - msg.timestamp < MAX_HISTORY_TIME_MS
  );

  if (recentFromSender.length < 2) {
    return { suspicious: false };
  }

  // Check if sending single digits repeatedly
  const singleDigitPattern = /^\s*\d\s*$/;
  const singleCharPattern = /^\s*[a-zA-Z0-9@.]\s*$/;
  
  const recentContents = recentFromSender.map(m => m.content.trim());
  const currentTrimmed = currentMessage.trim();
  
  // Check if last few messages are single digits
  if (singleDigitPattern.test(currentTrimmed)) {
    const digitMessages = recentContents.filter(m => singleDigitPattern.test(m));
    if (digitMessages.length >= 3) {
      const combined = digitMessages.join('');
      const digitsOnly = combined.replace(/\D/g, '');
      if (digitsOnly.length >= 7) {
        return { 
          suspicious: true, 
          pattern: 'Sequential single digits detected' 
        };
      }
    }
  }

  // Check if sending email characters one at a time
  if (singleCharPattern.test(currentTrimmed)) {
    const charMessages = recentContents.filter(m => singleCharPattern.test(m));
    if (charMessages.length >= 5) {
      const combined = charMessages.join('');
      if (combined.includes('@') || detectEmails(combined).length > 0) {
        return { 
          suspicious: true, 
          pattern: 'Sequential characters suggesting email address' 
        };
      }
    }
  }

  // Check for sequential number words (one, two, three sent separately)
  const numberWordPattern = /^\s*(?:one|two|three|four|five|six|seven|eight|nine|zero|oh|won|too|to|for|ate)\s*$/i;
  if (numberWordPattern.test(currentTrimmed)) {
    const allRecent = [...recentContents, currentTrimmed];
    const numberWordMessages = allRecent.filter(m => numberWordPattern.test(m));
    
    // If 3+ sequential number words detected
    if (numberWordMessages.length >= 3) {
      // Combine them and convert to digits
      const combined = numberWordMessages.join(' ');
      const converted = convertWordsToNumbers(combined);
      const digitsOnly = converted.replace(/\D/g, '');
      
      // Flag if pattern suggests phone number attempt (3+ digits)
      if (digitsOnly.length >= 3) {
        return { 
          suspicious: true, 
          pattern: 'Sequential number words detected (possible phone number attempt)' 
        };
      }
    }
  }

  // Check for single word messages that might be part of email
  const singleWordPattern = /^\s*[a-zA-Z0-9._-]+\s*$/;
  if (singleWordPattern.test(currentTrimmed) && currentTrimmed.length > 2) {
    const allRecent = [...recentContents, currentTrimmed];
    const wordMessages = allRecent.filter(m => singleWordPattern.test(m) && m.length > 2);
    
    // If sending words that could form email when combined
    if (wordMessages.length >= 3) {
      // Check if combination looks like email parts
      const combined = wordMessages.join(' ');
      const lowerCombined = combined.toLowerCase();
      
      // Look for patterns like "john at gmail dot com" or "user @ domain . com"
      if (lowerCombined.includes('at') || lowerCombined.includes('@') || 
          lowerCombined.includes('dot') || lowerCombined.includes('.')) {
        const emails = detectEmails(combined);
        if (emails.length > 0) {
          return { 
            suspicious: true, 
            pattern: 'Sequential words suggesting email address' 
          };
        }
      }
    }
  }

  // Check combined recent messages for contact info
  const combinedRecent = recentFromSender
    .slice(-10)
    .map(m => m.content)
    .join(' ');
  
  // Also include current message in the check
  const fullCombined = combinedRecent + ' ' + currentMessage;
  
  const combinedEmails = detectEmails(fullCombined);
  const combinedPhones = detectPhoneNumbers(fullCombined);
  
  if (combinedEmails.length > 0 || combinedPhones.length > 0) {
    return { 
      suspicious: true, 
      pattern: 'Contact information detected across multiple messages' 
    };
  }

  return { suspicious: false };
}

/**
 * Checks if user is currently blocked from sending messages
 */
function checkUserBlock(contextId: string, senderId: string): { isBlocked: boolean; timeRemaining: number } {
  if (!contextId || !senderId) {
    return { isBlocked: false, timeRemaining: 0 };
  }

  const blockKey = `${contextId}_${senderId}`;
  const block = userBlocks.get(blockKey);

  if (!block) {
    return { isBlocked: false, timeRemaining: 0 };
  }

  const now = Date.now();

  // Check if block has expired
  if (now >= block.blockedUntil) {
    // Reset if violation period has passed
    if (now - block.blockedUntil > VIOLATION_RESET_TIME) {
      userBlocks.delete(blockKey);
    } else {
      // Block expired but keep tracking violations
      block.blockedUntil = 0;
    }
    return { isBlocked: false, timeRemaining: 0 };
  }

  return {
    isBlocked: true,
    timeRemaining: block.blockedUntil - now,
  };
}

/**
 * Records a violation and applies temporary block if needed
 */
function recordViolation(contextId: string, senderId: string): void {
  if (!contextId || !senderId) return;

  const blockKey = `${contextId}_${senderId}`;
  const block = userBlocks.get(blockKey) || { violationCount: 0, blockedUntil: 0 };
  const now = Date.now();

  // Reset violation count if enough time has passed
  if (block.violationCount > 0 && block.blockedUntil > 0 && now - block.blockedUntil > VIOLATION_RESET_TIME) {
    block.violationCount = 0;
  }

  // Increment violation count
  block.violationCount++;

  // Apply temporary block based on violation count
  const blockIndex = Math.min(block.violationCount - 1, BLOCK_DURATIONS.length - 1);
  block.blockedUntil = now + BLOCK_DURATIONS[blockIndex];

  userBlocks.set(blockKey, block);
}

/**
 * Checks if a message contains contact information (email or phone)
 * Also checks message history for patterns across multiple messages
 * @param message - The message text to check
 * @param contextId - Conversation ID or session ID for history tracking
 * @param senderId - User ID of the sender for pattern detection
 * @returns Object with detection results and user-friendly message
 */
export function checkForContactInfo(
  message: string,
  contextId?: string,
  senderId?: string
): ContactInfoCheckResult {
  // Check if user is currently blocked
  let isTemporarilyBlocked = false;
  let blockTimeRemaining = 0;

  if (contextId && senderId) {
    const blockCheck = checkUserBlock(contextId, senderId);
    if (blockCheck.isBlocked) {
      isTemporarilyBlocked = true;
      blockTimeRemaining = blockCheck.timeRemaining;
      
      const minutes = Math.ceil(blockTimeRemaining / (60 * 1000));
      return {
        hasContactInfo: true,
        detectedEmails: [],
        detectedPhones: [],
        message: `You are temporarily blocked from sending messages for ${minutes} minute${minutes !== 1 ? 's' : ''} due to repeated attempts to share contact information. Please wait before trying again.`,
        isTemporarilyBlocked: true,
        blockTimeRemaining,
      };
    }
  }

  // Standard detection
  const emails = detectEmails(message);
  const phones = detectPhoneNumbers(message);
  
  // Pattern detection across messages if context provided
  let suspiciousPattern: string | undefined;
  if (contextId && senderId) {
    const patternCheck = detectSuspiciousPattern(message, contextId, senderId);
    if (patternCheck.suspicious) {
      suspiciousPattern = patternCheck.pattern;
      
      // Also check combined recent messages
      const history = recentMessageHistory.get(contextId) || [];
      const recentFromSender = history.filter(
        msg => msg.senderId === senderId && 
        Date.now() - msg.timestamp < MAX_HISTORY_TIME_MS
      );
      
      if (recentFromSender.length > 0) {
        const combined = [...recentFromSender.map(m => m.content), message].join(' ');
        const combinedEmails = detectEmails(combined);
        const combinedPhones = detectPhoneNumbers(combined);
        
        emails.push(...combinedEmails);
        phones.push(...combinedPhones);
      }
    }
  }
  
  const hasContactInfo = emails.length > 0 || phones.length > 0 || !!suspiciousPattern;
  
  // If contact info detected, record violation and potentially block
  if (hasContactInfo && contextId && senderId) {
    recordViolation(contextId, senderId);
    
    // Check if this violation triggers a new block
    const blockCheck = checkUserBlock(contextId, senderId);
    if (blockCheck.isBlocked) {
      isTemporarilyBlocked = true;
      blockTimeRemaining = blockCheck.timeRemaining;
    }
  }
  
  let messageText = '';
  if (hasContactInfo) {
    const parts: string[] = [];
    if (emails.length > 0) {
      parts.push(`email address${emails.length > 1 ? 'es' : ''}`);
    }
    if (phones.length > 0) {
      parts.push(`phone number${phones.length > 1 ? 's' : ''}`);
    }
    if (suspiciousPattern) {
      parts.push(`suspicious pattern (${suspiciousPattern.toLowerCase()})`);
    }
    
    if (isTemporarilyBlocked) {
      const minutes = Math.ceil(blockTimeRemaining / (60 * 1000));
      messageText = `Your message ${suspiciousPattern ? 'or recent messages ' : ''}contain${suspiciousPattern ? '' : 's'} ${parts.join(' and ')}. You are temporarily blocked from sending messages for ${minutes} minute${minutes !== 1 ? 's' : ''} due to repeated violations.`;
    } else {
      messageText = `Your message ${suspiciousPattern ? 'or recent messages ' : ''}contain${suspiciousPattern ? '' : 's'} ${parts.join(' and ')}. For security reasons, sharing contact information is not allowed in chat.`;
    }
  }

  // Store message in history if context provided
  if (contextId && senderId) {
    const history = recentMessageHistory.get(contextId) || [];
    history.push({
      content: message,
      timestamp: Date.now(),
      senderId,
    });
    
    // Keep only recent messages
    const recentHistory = history
      .filter(m => Date.now() - m.timestamp < MAX_HISTORY_TIME_MS)
      .slice(-MAX_HISTORY_MESSAGES);
    
    recentMessageHistory.set(contextId, recentHistory);
  }

  return {
    hasContactInfo,
    detectedEmails: [...new Set(emails)],
    detectedPhones: [...new Set(phones)],
    message: messageText,
    suspiciousPattern,
    isTemporarilyBlocked,
    blockTimeRemaining,
  };
}

/**
 * Clears message history for a context (e.g., when conversation/session ends)
 */
export function clearMessageHistory(contextId: string): void {
  recentMessageHistory.delete(contextId);
}

/**
 * Clears user blocks for a context (e.g., admin action or conversation reset)
 */
export function clearUserBlocks(contextId: string, senderId?: string): void {
  if (senderId) {
    const blockKey = `${contextId}_${senderId}`;
    userBlocks.delete(blockKey);
  } else {
    // Clear all blocks for this context
    const keysToDelete: string[] = [];
    userBlocks.forEach((_, key) => {
      if (key.startsWith(`${contextId}_`)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => userBlocks.delete(key));
  }
}

/**
 * Sanitizes a message by removing or masking contact information
 * @param message - The message text to sanitize
 * @returns Sanitized message with contact info replaced
 */
export function sanitizeMessage(message: string): string {
  let sanitized = message;

  // Replace emails with [Email Removed]
  sanitized = sanitized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[Email Removed]');

  // Replace phone numbers with [Phone Removed]
  // Apply the same patterns used for detection
  const phonePatterns = [
    /\+\d{1,3}[\s.-]?\d{1,4}[\s.-]?\d{1,4}[\s.-]?\d{4,}/g,
    /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g,
    /[6-9]\d{9}/g,
    /\d{3,}[\s.-]?\d{3,}[\s.-]?\d{3,}/g,
  ];

  phonePatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, (match) => {
      const digitsOnly = match.replace(/\D/g, '');
      if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
        return '[Phone Removed]';
      }
      return match;
    });
  });

  return sanitized;
}

