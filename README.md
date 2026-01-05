
# 🚀 TradeMind 雲端架設與部署指南

這份文件將引導您如何將 TradeMind 部署到 Vercel 平台，實現全天候在線訪問。

## 🛠️ 第一步：準備工作
1. **GitHub 帳號**：用於存放程式碼。
2. **Gemini API Key**：前往 [Google AI Studio](https://aistudio.google.com/app/apikey) 點擊 "Create API key" 取得以 `AIza` 開頭的字串。
3. **GitHub Token (Gist)**：用於跨裝置同步交易日誌。
   - 前往 GitHub Settings > Developer settings > Tokens (classic)。
   - 生成一個勾選了 `gist` 權限的 Token。

## 🌐 第二步：部署至 Vercel (免費)
1. **上傳至 GitHub**：建立一個新的 **Private** Repository，並將所有專案檔案上傳。
2. **連結 Vercel**：
   - 登入 [Vercel](https://vercel.com/)。
   - 點擊 **Add New Project** 並匯入您的 GitHub Repository。
3. **設定環境變數 (極重要)**：
   - 在部署設定頁面找到 **Environment Variables**。
   - **Key**: `API_KEY`
   - **Value**: (貼上您從 Google 取得的 AIza... 字串)
4. **Deploy**：點擊部署，一分鐘後您的網站就會上線。

## 🔍 第三步：部署後檢查
- **如果 AI 導師沒反應**：
  1. 檢查 Vercel 控制台中的 Environment Variables 名稱是否精確為 `API_KEY`。
  2. 確保沒有複製到多餘的空白字元。
  3. 點擊 Vercel 的 "Redeploy" 確保設定生效。

## 📱 手機端使用優化
1. 使用 iPhone (Safari) 或 Android (Chrome) 開啟您的 Vercel 網址。
2. 點擊瀏覽器的 **「分享」** 或 **「選單」**。
3. 選擇 **「加入主畫面 (Add to Home Screen)」**。
4. 這樣 TradeMind 就會像原生 App 一樣顯示在桌面，且擁有獨立的沉浸式介面。

## 🔒 數據安全性說明
- **交易數據**：預設儲存在您的瀏覽器。
- **雲端備份**：如果您設定了 GitHub Token，數據將加密存存在您個人的 **GitHub Gist** (私有) 中。
