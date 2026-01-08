
import { Trade, GitHubConfig, User } from '../types';

export interface CloudState {
  trades: Trade[];
  users: User[];
  setups: string[];
  symbols: string[];
  syncedAt: string;
}

export const syncToGithub = async (config: GitHubConfig, state: CloudState): Promise<string> => {
  const content = JSON.stringify(state, null, 2);
  const fileName = 'trademind_pro_v2.json';
  
  const headers = {
    'Authorization': `token ${config.token}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  const body = {
    description: 'TradeMind Pro - Cloud Database (Auto-Sync)',
    public: false,
    files: {
      [fileName]: { content }
    }
  };

  try {
    let response;
    if (config.gistId && config.gistId.length > 5) {
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

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.message || 'GitHub 同步失敗，請檢查 Token 權限。');
    }
    
    const data = await response.json();
    return data.id;
  } catch (err: any) {
    console.error("Cloud Sync Error:", err);
    throw new Error(err.message);
  }
};

export const pullFromGithub = async (token: string, gistId: string): Promise<CloudState> => {
  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: { 'Authorization': `token ${token}` }
  });
  
  if (!response.ok) throw new Error('讀取雲端資料失敗，請檢查 Gist ID 是否正確。');
  
  const data = await response.json();
  const file = Object.values(data.files)[0] as any;
  return JSON.parse(file.content);
};
