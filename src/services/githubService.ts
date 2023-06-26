import { getInput } from '@actions/core';
import { context, getOctokit } from '@actions/github';
import type { GraphQlQueryResponseData } from "@octokit/graphql";

export const fetchLatestReleaseTag = async () => {
  try {
    const githubToken = getInput('github_token', { required: true });
    const useTagInsteadOfRelease = getInput('use_tag', {required: true})
    const octokit = getOctokit(githubToken);
    const { owner, repo } = context.repo;
    if(useTagInsteadOfRelease) {
      const response = await octokit.graphql<GraphQlQueryResponseData>(
        `
          query latestTags($owner: String!, $repo: String!) {
            repository(owner: $owner, name: $repo) {
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
      console.log(response)  
      return (response.refs.edges as Array<{node: {name: string}}>)[0]?.node?.name;
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
