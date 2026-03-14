// Icarus AI Service
// Handles dataset analysis, summarization, and malicious content verification

export interface AnalysisResult {
  summary: string;
  isMalicious: boolean;
  threatLevel: 'low' | 'medium' | 'high';
  recommendation: string;
  verifiedColumns: string[];
}

export class IcarusAI {
  /**
   * Analyzes a dataset based on its metadata and columns
   */
  static async analyzeDataset(
    title: string, 
    description: string, 
    columns: string[]
  ): Promise<AnalysisResult> {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simple analysis logic for demonstration
    const maliciousKeywords = ['virus', 'malware', 'exploit', 'credit card', 'password', 'social security'];
    const hasMaliciousKeywords = columns.some(col => 
      maliciousKeywords.some(keyword => col.toLowerCase().includes(keyword))
    ) || maliciousKeywords.some(keyword => title.toLowerCase().includes(keyword));

    const summary = `This dataset contains ${columns.length} columns focused on ${title}. 
      Key attributes include ${columns.slice(0, 3).join(', ')}. 
      The data structure appears consistent with ${description.substring(0, 50)}...`;

    return {
      summary,
      isMalicious: hasMaliciousKeywords,
      threatLevel: hasMaliciousKeywords ? 'high' : 'low',
      recommendation: hasMaliciousKeywords 
        ? 'WARNING: This dataset contains potentially sensitive or malicious column names. Proceed with caution.'
        : 'Dataset appears safe for use and matches its description.',
      verifiedColumns: columns
    };
  }

  /**
   * Verifies data integrity and security
   */
  static async verifyDataSafety(sampleData: any[]): Promise<boolean> {
    // Simulate scanning sample data for malicious patterns
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Check for common malicious patterns in strings (e.g., script tags, SQL injection)
    const maliciousPatterns = [/<script/i, /DROP TABLE/i, /UNION SELECT/i];
    
    for (const row of sampleData) {
      for (const value of Object.values(row)) {
        if (typeof value === 'string') {
          if (maliciousPatterns.some(pattern => pattern.test(value))) {
            return false;
          }
        }
      }
    }
    
    return true;
  }
}
