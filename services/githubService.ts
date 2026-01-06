
import { Trade, GitHubConfig } from '../types';

export const syncToGithub = async (config: GitHubConfig, trades: Trade[], setups: string[]): Promise<string> => {
  const content = JSON.stringify({ trades, setups, syncedAt: new Date().toISOString() });
  const fileName = 'trademind_backup.json';
  
  const headers = {
    'Authorization': `token ${config.token}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  const body = {
    description: 'TradeMind AI Backup Data',
    public: false,
    files: {
      [fileName]: { content }
    }
  };

  try {
    let response;
    if (config.gistId) {
      // Update existing gist
      response = await fetch(`https://api.github.com/gists/${config.gistId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body),
      });
    } else {
      // Create new gist
      response = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
    }

    if (!response.ok) throw new Error('GitHub 同步失敗，請檢查 Token 權限。');
    
    const data = await response.json();
    return data.id;
  } catch (err: any) {
    throw new Error(err.message);
  }
};

export const pullFromGithub = async (token: string, gistId: string) => {
  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: { 'Authorization': `token ${token}` }
  });
  
  if (!response.ok) throw new Error('讀取雲端資料失敗。');
  
  const data = await response.json();
  const file = Object.values(data.files)[0] as any;
  return JSON.parse(file.content);
};
