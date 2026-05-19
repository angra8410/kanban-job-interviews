import { githubService } from './github.service';
import { JobStatus } from '../../models/status.model';

export class ProjectAutomationService {
  /**
   * Maps JobStatus to Project Column Names
   */
  private statusMap: Record<JobStatus, string> = {
    [JobStatus.APPLIED]: 'Applied',
    [JobStatus.RECRUITER_CONTACT]: 'Recruiter Contact',
    [JobStatus.INTERVIEW]: 'Interview',
    [JobStatus.TECHNICAL_INTERVIEW]: 'Technical Interview',
    [JobStatus.ASSESSMENT]: 'Assessment',
    [JobStatus.OFFER]: 'Offer',
    [JobStatus.REJECTED]: 'Rejected',
    [JobStatus.GHOSTED]: 'Ghosted',
    [JobStatus.UNKNOWN]: 'Todo'
  };

  /**
   * Finds an existing item in the project by title (prevent duplicates)
   */
  async findExistingItem(projectId: string, title: string): Promise<string | null> {
    const query = `
      query($projectId: ID!) {
        node(id: $projectId) {
          ... on ProjectV2 {
            items(first: 100) {
              nodes {
                id
                content {
                  ... on DraftIssue {
                    title
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response: any = await githubService.graphql(query, { projectId });
    const items = response.node.items.nodes;
    const existing = items.find((item: any) => item.content?.title === title);
    
    return existing ? existing.id : null;
  }

  /**
   * Adds a new Draft Issue to the Project
   */
  async addProjectItem(projectId: string, title: string, body: string): Promise<string> {
    const query = `
      mutation($projectId: ID!, $title: String!, $body: String!) {
        addProjectV2DraftIssue(input: {projectId: $projectId, title: $title, body: $body}) {
          projectItem {
            id
          }
        }
      }
    `;

    const response: any = await githubService.graphql(query, { projectId, title, body });
    return response.addProjectV2DraftIssue.projectItem.id;
  }

  /**
   * Updates a Single Select field (Status) for a project item
   */
  async updateItemStatus(projectId: string, itemId: string, fieldId: string, optionId: string) {
    const query = `
      mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
        updateProjectV2ItemFieldValue(input: {
          projectId: $projectId,
          itemId: $itemId,
          fieldId: $fieldId,
          value: { singleSelectOptionId: $optionId }
        }) {
          projectV2Item {
            id
          }
        }
      }
    `;

    return await githubService.graphql(query, { projectId, itemId, fieldId, optionId });
  }

  /**
   * Gets the mapped status name
   */
  getMappedStatus(status: JobStatus): string {
    return this.statusMap[status];
  }
}

export const projectAutomationService = new ProjectAutomationService();
