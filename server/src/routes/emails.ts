import { Router } from 'express';
import { EmailService } from '../services/EmailService';
import { serverConfig } from '../config';

const router = Router();
const emailService = new EmailService(serverConfig.email);

router.get('/unread', async (req, res) => {
  try {
    console.log('Received request for unread emails');
    console.log('Query params:', req.query);

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Enforce reasonable limits
    if (limit > 50) {
      return res.status(400).json({ error: 'Limit cannot exceed 50 emails per page' });
    }

    console.log('Fetching emails with:', { page, limit });
    const result = await emailService.getUnreadEmails(page, limit);
    console.log('Got emails:', {
      count: result.emails.length,
      total: result.total
    });

    res.json({
      emails: result.emails,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit)
      }
    });
  } catch (error) {
    console.error('Server error fetching emails:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router; 