export enum JobStatus {
  APPLIED = 'Applied',
  RECRUITER_CONTACT = 'Recruiter Contact',
  INTERVIEW = 'Interview',
  TECHNICAL_INTERVIEW = 'Technical Interview',
  ASSESSMENT = 'Assessment',
  OFFER = 'Offer',
  REJECTED = 'Rejected',
  GHOSTED = 'Ghosted',
  UNKNOWN = 'Unknown'
}

export interface ClassificationResult {
  status: JobStatus;
  confidence: number;
  reason: string;
}
