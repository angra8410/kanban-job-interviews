import { Router, Request, Response } from 'express';
import { gmailAuthService } from '../services/gmail/auth.service';

const router = Router();

/**
 * Trigger Gmail OAuth2 flow
 */
router.get('/auth/gmail', async (req: Request, res: Response) => {
  try {
    await gmailAuthService.authorize();
    res.json({ message: 'Gmail authentication successful' });
  } catch (error: any) {
    console.error('Gmail Auth Error:', error);
    res.status(500).json({ error: 'Authentication failed', details: error.message });
  }
});

/**
 * Check Gmail auth status
 */
router.get('/auth/gmail/status', async (req: Request, res: Response) => {
  try {
    const client = await gmailAuthService.loadSavedCredentialsIfExist();
    res.json({ authenticated: !!client });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check status' });
  }
});

export default router;
