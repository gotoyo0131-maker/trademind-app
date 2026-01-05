
import { Trade } from "../types";

export interface GitHubConfig {
  token: string;
  gistId?: string;
}

const GIST_FILENAME = "trademind_backup.json";

export const syncToGithub = async (config: GitHubConfig, trades: Trade[], setups: string[]) => {
  const { token, gistId } = config;
  const content = JSON.stringify({ trades, setups, updatedAt: new Date().toISOString() });

  const method = gistId ? 'PATCH' : 'POST';
  const url = gistId ? `https://api.github.com/gists/${gistId}` : 'https://api.github.com/gists';

  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: "TradeMind Journal Backup (Private)",
      public: false,
      files: {
        [GIST_FILENAME]: { content }
      }
    })
  });

  if (!response.ok) throw new Error('GitHub 同步失敗，請檢查 Token 權限。');
  const result = await response.json();
  return result.id as string;
};

export const pullFromGithub = async (token: string, gistId: string) => {
  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
    }
  });

  if (!response.ok) throw new Error('無法從雲端拉取資料，請檢查 Gist ID。');
  const result = await response.json();
  const fileContent = result.files[GIST_FILENAME].content;
  return JSON.parse(fileContent) as { trades: Trade[], setups: string[] };
};
