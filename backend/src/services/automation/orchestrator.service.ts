import { emailListenerService } from '../gmail/emailListener.service';
import { classifierService } from '../classifier/classifier.service';
import { projectAutomationService } from '../github/projectAutomation.service';
import { githubService } from '../github/github.service';
import { gmailService } from '../gmail/gmail.service';
import { config } from '../../config';
import { JobStatus } from '../../models/status.model';

export class OrchestratorService {
  private projectId: string = '';
  private statusFieldId: string = '';
  private statusOptions: Map<string, string> = new Map(); // Name -> ID

  /**
   * Initializes project details by fetching them from GitHub.
   */
  private async initializeProject() {
    if (this.projectId) return;

    console.log(`Initializing project details for ${config.github.owner}/projects/${config.github.projectNumber}...`);
    const details: any = await githubService.getProjectDetails(
      config.github.owner!,
      config.github.projectNumber!
    );

    const project = details.user?.projectV2 || details.organization?.projectV2;
    if (!project) throw new Error('Project not found');

    this.projectId = project.id;
    
    const statusField = project.fields.nodes.find((f: any) => f.name === 'Status');
    if (!statusField) throw new Error('Status field not found in project');

    this.statusFieldId = statusField.id;
    statusField.options.forEach((opt: any) => {
      this.statusOptions.set(opt.name, opt.id);
    });
    
    console.log('Project initialized successfully.');
  }

  /**
   * Run the full automation pipeline.
   */
  async runPipeline() {
    try {
      await this.initializeProject();
      
      console.log('Fetching unread emails...');
      const emails = await emailListenerService.fetchEmails('is:unread');
      console.log(`Found ${emails.length} unread email(s).`);

      for (const email of emails) {
        console.log(`\nProcessing email: "${email.subject}" from ${email.sender}`);
        
        // 1. Classify
        const classification = await classifierService.classify(email);
        console.log(`Classification: ${classification.status} (Confidence: ${classification.confidence})`);

        if (classification.status === JobStatus.UNKNOWN) {
          console.log('Skipping unknown classification.');
          continue;
        }

        // 2. Extract Company Name (Simple heuristic: from Subject or Sender)
        const companyName = this.extractCompanyName(email);
        const cardTitle = `${companyName} - Job Application`;

        // 3. Find or Create Project Item
        let itemId = await projectAutomationService.findExistingItem(this.projectId, cardTitle);
        
        if (itemId) {
          console.log(`Existing card found (ID: ${itemId}). Updating status...`);
        } else {
          console.log(`No existing card found. Creating new card: "${cardTitle}"...`);
          itemId = await projectAutomationService.addProjectItem(
            this.projectId,
            cardTitle,
            `Source: Gmail\nFrom: ${email.sender}\nDate: ${email.receivedAt.toISOString()}\n\nSummary:\n${email.body.substring(0, 500)}...`
          );
        }

        // 4. Update Status
        const githubStatusName = projectAutomationService.getMappedStatus(classification.status);
        const optionId = this.statusOptions.get(githubStatusName);

        if (optionId) {
          await projectAutomationService.updateItemStatus(
            this.projectId,
            itemId,
            this.statusFieldId,
            optionId
          );
          console.log(`Status updated to "${githubStatusName}".`);
        } else {
          console.warn(`Could not find option ID for status: "${githubStatusName}"`);
        }

        // 5. Mark as read to avoid re-processing
        await gmailService.markAsRead(email.id);
        console.log('Email marked as read.');
      }

      console.log('\nPipeline execution completed.');
    } catch (error) {
      console.error('Pipeline Error:', error);
      throw error;
    }
  }

  /**
   * Heuristic to extract company name from email data.
   */
  private extractCompanyName(email: any): string {
    // Try to extract from subject like "Application at [Company]"
    const subjectMatch = email.subject.match(/at\s+([A-Z][A-Za-z0-9\s]+)/);
    if (subjectMatch) return subjectMatch[1].trim();

    // Try to extract from sender domain if it's not a common provider
    const domainMatch = email.sender.match(/@([a-zA-Z0-9.-]+)/);
    if (domainMatch) {
      const domain = domainMatch[1].toLowerCase();
      if (!['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com', 'icloud.com'].includes(domain)) {
        return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
      }
    }

    return 'Unknown Company';
  }
}

export const orchestratorService = new OrchestratorService();
