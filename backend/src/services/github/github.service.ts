import { Octokit } from '@octokit/core';
import { config } from '../../config';

export class GithubService {
  private octokit: Octokit;

  constructor() {
    if (!config.github.token) {
      throw new Error('GITHUB_TOKEN is not defined in environment variables');
    }
    this.octokit = new Octokit({ auth: config.github.token });
  }

  /**
   * Executes a GraphQL query against GitHub API
   */
  async graphql(query: string, variables: Record<string, any> = {}) {
    try {
      return await this.octokit.graphql(query, variables);
    } catch (error) {
      console.error('GitHub GraphQL Error:', error);
      throw error;
    }
  }

  /**
   * Helper to get Project V2 ID and its fields
   */
  async getProjectDetails(login: string, projectNumber: number, isOrg: boolean = false) {
    const query = `
      query($login: String!, $number: Int!) {
        ${isOrg ? 'organization' : 'user'}(login: $login) {
          projectV2(number: $number) {
            id
            title
            fields(first: 20) {
              nodes {
                ... on ProjectV2SingleSelectField {
                  id
                  name
                  options {
                    id
                    name
                  }
                }
              }
            }
          }
        }
      }
    `;

    return await this.graphql(query, { login, number: projectNumber });
  }
}

export const githubService = new GithubService();
