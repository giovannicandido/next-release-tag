import { getInput } from '@actions/core';
import { context, getOctokit } from '@actions/github';

export const fetchLatestReleaseTag = async () => {
  try {
    const githubToken = getInput('github_token', { required: true });
    const useTagInsteadOfRelease = getInput('use_tag', {required: true})
    const octokit = getOctokit(githubToken);
    const { owner, repo } = context.repo;
    if(useTagInsteadOfRelease) {
      const { latestTags } = await octokit.graphql<{latestTags: any}>(
        `
          query latestTags($owner: String!, $repo: String!) {
            repository($owner: String!, $repo: String!) {
              refs(refPrefix: "refs/tags/", first: 1, orderBy: {field: TAG_COMMIT_DATE, direction: DESC}) {
                edges {
                  node {
                    name
                    target {
                      oid
                      ... on Tag {
                        message
                        commitUrl
                        tagger {
                          name
                          email
                          date
                        }
                      }
                    }
                  }
                }
              }
            }
          }
    
        `,
        {
          owner: owner,
          repo: repo,
        }
      );
      return latestTags.name;
    } else {
      const response = await octokit.rest.repos.getLatestRelease({
        owner,
        repo,
      });
      return response.data.tag_name;
    }
    
  } catch (error: any) {
    // No releases yet
    if (error?.response?.status === 404) {
      return null;
    }
    throw error;
  }
};
