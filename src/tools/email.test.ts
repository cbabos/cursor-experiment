import { describe, it, expect, vi } from 'vitest';
import { emailTool } from './email';
import { EmailService, ParsedEmail } from '../services/EmailService';

vi.mock('../services/EmailService');

describe('emailTool', () => {
  it('should have correct metadata', () => {
    expect(emailTool.name).toBe('email');
    expect(emailTool.description).toContain('Check unread emails');
  });

  it('should handle no unread emails', async () => {
    vi.mocked(EmailService.prototype.getUnreadEmails).mockResolvedValue([]);
    const result = await emailTool.execute({});
    expect(result).toBe('No unread emails found.');
  });

  it('should format and categorize emails correctly', async () => {
    const mockEmails: ParsedEmail[] = [
      {
        subject: 'Urgent Meeting',
        from: 'boss@company.com',
        date: new Date(),
        text: 'Important meeting tomorrow',
        importance: 'high',
      },
      {
        subject: 'Project Update',
        from: 'team@company.com',
        date: new Date(),
        text: 'Weekly project status',
        importance: 'medium',
      },
      {
        subject: 'Newsletter',
        from: 'news@company.com',
        date: new Date(),
        text: 'Weekly newsletter',
        importance: 'low',
      },
    ];

    vi.mocked(EmailService.prototype.getUnreadEmails).mockResolvedValue(mockEmails);
    const result = await emailTool.execute({});

    expect(result).toContain('Found 3 unread email(s)');
    expect(result).toContain('🔴 High Priority');
    expect(result).toContain('🟡 Medium Priority');
    expect(result).toContain('🟢 Low Priority');
    expect(result).toContain('[HIGH] "Urgent Meeting"');
    expect(result).toContain('[MEDIUM] "Project Update"');
    expect(result).toContain('[LOW] "Newsletter"');
  });

  it('should handle errors gracefully', async () => {
    const error = new Error('Failed to connect');
    vi.mocked(EmailService.prototype.getUnreadEmails).mockRejectedValue(error);
    const result = await emailTool.execute({});
    expect(result).toBe('Error checking emails: Failed to connect');
  });
}); 