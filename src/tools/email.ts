import axios from 'axios';

interface EmailSummary {
  id: string;
  subject: string;
  from: string;
  date: Date;
  snippet?: string;
  hasAttachments: boolean;
  size: number;
}

interface PaginatedResponse {
  emails: EmailSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const emailTool = {
  name: 'email',
  description: 'Check unread emails and classify them by importance',
  execute: async () => {
    try {
      const response = await axios.get<PaginatedResponse>('http://localhost:3001/api/emails/unread', {
        params: {
          page: 1,
          limit: 50
        }
      });

      const { emails, pagination } = response.data;

      if (emails.length === 0) {
        return 'No unread emails found.';
      }

      const filterForValidEmail = (email: EmailSummary) => {
        return email.subject && email.from;
      };

      const formatEmail = (email: EmailSummary) => {
        const date = new Date(email.date).toLocaleString();
        const size = (email.size / 1024).toFixed(1) + ' KB';
        const fromParts = email.from.match(/"([^"]+)" <([^>]+)>/) || [null, email.from, ''];
        const fromName = fromParts[1] || fromParts[2];
        
        return `
- From: ${fromName}
  Subject: ${email.subject || 'No Subject'}
  Date: ${date}
  ${email.hasAttachments ? '📎 Has attachments' : ''}
  Size: ${size}${email.snippet ? `\n  Preview: ${email.snippet}` : ''}`;
      };

      const validEmails = emails.filter(filterForValidEmail);
      const summary = `Found ${validEmails.length} unread email(s):\n${validEmails.map(formatEmail).join('\n')}`;

      if (pagination.total > pagination.limit) {
        return `${summary}\n\nNote: There are more unread emails. You can request the next page to see more.`;
      }

      return summary;
    } catch (error) {
      console.error('Error checking emails:', error);
      if (axios.isAxiosError(error)) {
        return `Error checking emails: ${error.response?.data?.error || error.message}`;
      }
      return 'Error checking emails. Please try again later.';
    }
  }
}; 