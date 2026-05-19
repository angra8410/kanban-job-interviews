import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  gmail: {
    clientId: process.env.GMAIL_CLIENT_ID,
    clientSecret: process.env.GMAIL_CLIENT_SECRET,
    redirectUri: process.env.GMAIL_REDIRECT_URI,
    refreshToken: process.env.GMAIL_REFRESH_TOKEN,
    credentialsPath: path.join(__dirname, 'credentials.json'),
    tokenPath: path.join(__dirname, '../../token.json'),
    scopes: ['https://www.googleapis.com/auth/gmail.modify'],
  },
  github: {
    token: process.env.GITHUB_TOKEN,
    owner: process.env.GITHUB_OWNER,
    projectNumber: parseInt(process.env.GITHUB_PROJECT_NUMBER || '0'),
  },
};
