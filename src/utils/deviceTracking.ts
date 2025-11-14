/**
 * Utility functions for detecting browser and device information
 */

export interface DeviceInfo {
  browserName: string;
  browserVersion: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  osName: string;
  osVersion: string;
  userAgent: string;
}

/**
 * Detect device type from user agent
 */
export function detectDeviceType(userAgent: string): 'desktop' | 'mobile' | 'tablet' {
  const ua = userAgent.toLowerCase();
  
  // Check for tablets first (tablets often have mobile in user agent)
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobile))/i.test(ua)) {
    return 'tablet';
  }
  
  // Check for mobile devices
  if (/mobile|android|iphone|ipod|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(ua)) {
    return 'mobile';
  }
  
  // Default to desktop
  return 'desktop';
}

/**
 * Detect browser name and version from user agent
 */
export function detectBrowser(userAgent: string): { name: string; version: string } {
  const ua = userAgent.toLowerCase();
  
  // Chrome (including Edge Chromium)
  if (ua.includes('edg/')) {
    const match = userAgent.match(/edg\/([\d.]+)/i);
    return {
      name: 'edge',
      version: match ? match[1] : 'unknown'
    };
  }
  
  if (ua.includes('chrome/')) {
    const match = userAgent.match(/chrome\/([\d.]+)/i);
    return {
      name: 'chrome',
      version: match ? match[1] : 'unknown'
    };
  }
  
  // Firefox
  if (ua.includes('firefox/')) {
    const match = userAgent.match(/firefox\/([\d.]+)/i);
    return {
      name: 'firefox',
      version: match ? match[1] : 'unknown'
    };
  }
  
  // Safari (but not Chrome)
  if (ua.includes('safari/') && !ua.includes('chrome/')) {
    const match = userAgent.match(/version\/([\d.]+).*safari/i);
    return {
      name: 'safari',
      version: match ? match[1] : 'unknown'
    };
  }
  
  // Opera
  if (ua.includes('opera/') || ua.includes('opr/')) {
    const match = userAgent.match(/(?:opera|opr)\/([\d.]+)/i);
    return {
      name: 'opera',
      version: match ? match[1] : 'unknown'
    };
  }
  
  // Default
  return {
    name: 'other',
    version: 'unknown'
  };
}

/**
 * Detect OS name and version from user agent
 */
export function detectOS(userAgent: string): { name: string; version: string } {
  const ua = userAgent.toLowerCase();
  
  // Windows
  if (ua.includes('windows')) {
    const match = userAgent.match(/windows nt ([\d.]+)/i);
    let version = 'unknown';
    if (match) {
      const ntVersion = match[1];
      const versionMap: { [key: string]: string } = {
        '10.0': '10',
        '6.3': '8.1',
        '6.2': '8',
        '6.1': '7',
        '6.0': 'Vista',
        '5.1': 'XP'
      };
      version = versionMap[ntVersion] || ntVersion;
    }
    return { name: 'Windows', version };
  }
  
  // macOS
  if (ua.includes('mac os x') || ua.includes('macintosh')) {
    const match = userAgent.match(/mac os x ([\d_]+)/i);
    return {
      name: 'macOS',
      version: match ? match[1].replace(/_/g, '.') : 'unknown'
    };
  }
  
  // iOS
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
    const match = userAgent.match(/os ([\d_]+)/i);
    return {
      name: 'iOS',
      version: match ? match[1].replace(/_/g, '.') : 'unknown'
    };
  }
  
  // Android
  if (ua.includes('android')) {
    const match = userAgent.match(/android ([\d.]+)/i);
    return {
      name: 'Android',
      version: match ? match[1] : 'unknown'
    };
  }
  
  // Linux
  if (ua.includes('linux')) {
    return { name: 'Linux', version: 'unknown' };
  }
  
  // Default
  return { name: 'Unknown', version: 'unknown' };
}

/**
 * Get complete device information from user agent
 */
export function getDeviceInfo(): DeviceInfo {
  const userAgent = navigator.userAgent;
  const browser = detectBrowser(userAgent);
  const os = detectOS(userAgent);
  const deviceType = detectDeviceType(userAgent);
  
  return {
    browserName: browser.name,
    browserVersion: browser.version,
    deviceType,
    osName: os.name,
    osVersion: os.version,
    userAgent
  };
}

