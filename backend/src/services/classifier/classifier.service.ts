import { Email } from '../../models/email.model';
import { JobStatus, ClassificationResult } from '../../models/status.model';

interface Rule {
  status: JobStatus;
  keywords: RegExp[];
  weight: number;
}

export class ClassifierService {
  private rules: Rule[] = [
    {
      status: JobStatus.REJECTED,
      keywords: [
        /unfortunately/i,
        /not moving forward/i,
        /decided to pursue other candidates/i,
        /thank you for your interest/i,
        /unable to offer/i
      ],
      weight: 0.9
    },
    {
      status: JobStatus.OFFER,
      keywords: [
        /congratulations/i,
        /offer letter/i,
        /pleased to offer/i,
        /employment agreement/i
      ],
      weight: 0.95
    },
    {
      status: JobStatus.ASSESSMENT,
      keywords: [
        /assessment/i,
        /coding challenge/i,
        /take-home/i,
        /technical test/i,
        /hackerRank/i
      ],
      weight: 0.85
    },
    {
      status: JobStatus.TECHNICAL_INTERVIEW,
      keywords: [
        /technical interview/i,
        /live coding/i,
        /system design/i,
        /pair programming/i
      ],
      weight: 0.8
    },
    {
      status: JobStatus.INTERVIEW,
      keywords: [
        /interview/i,
        /invitation to/i,
        /zoom meeting/i,
        /schedule a call/i,
        /video call/i
      ],
      weight: 0.75
    },
    {
      status: JobStatus.RECRUITER_CONTACT,
      keywords: [
        /recruiter/i,
        /quick chat/i,
        /phone screen/i,
        /connecting/i
      ],
      weight: 0.6
    },
    {
      status: JobStatus.APPLIED,
      keywords: [
        /thank you for applying/i,
        /received your application/i,
        /application received/i,
        /confirmation/i
      ],
      weight: 0.5
    }
  ];

  /**
   * Classifies an email based on pre-defined regex rules.
   * Designed to be easily swapped for an LLM implementation.
   */
  async classify(email: Email): Promise<ClassificationResult> {
    const content = `${email.subject} ${email.body}`;
    let bestMatch: ClassificationResult = {
      status: JobStatus.UNKNOWN,
      confidence: 0,
      reason: 'No matching rules found'
    };

    for (const rule of this.rules) {
      const matchCount = rule.keywords.filter(regex => regex.test(content)).length;
      
      if (matchCount > 0) {
        // Simple confidence score based on weight and number of matches
        const confidence = Math.min(rule.weight + (matchCount * 0.05), 1);
        
        if (confidence > bestMatch.confidence) {
          bestMatch = {
            status: rule.status,
            confidence,
            reason: `Matched ${matchCount} keyword(s) for ${rule.status}`
          };
        }
      }
    }

    return bestMatch;
  }

  /**
   * Batch classifies multiple emails.
   */
  async classifyMany(emails: Email[]): Promise<Map<string, ClassificationResult>> {
    const results = new Map<string, ClassificationResult>();
    for (const email of emails) {
      results.set(email.id, await this.classify(email));
    }
    return results;
  }
}

export const classifierService = new ClassifierService();
