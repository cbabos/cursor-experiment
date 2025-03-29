import Imap from 'node-imap';
import { simpleParser } from 'mailparser';

export interface EmailConfig {
  user: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
}

export interface ParsedEmail {
  subject: string;
  from: string;
  date: Date;
  text: string;
  html?: string;
  importance: 'high' | 'medium' | 'low';
}

interface EmailSummary {
  id: string;
  subject: string;
  from: string;
  date: Date;
  snippet: string;
  hasAttachments: boolean;
  size: number;
}

export class EmailService {
  private imap: Imap;

  constructor(config: EmailConfig) {
    if (!config.user || !config.password) {
      throw new Error('Email credentials are required');
    }

    this.imap = new Imap({
      user: config.user,
      password: config.password,
      host: config.host,
      port: config.port,
      tls: config.tls,
      tlsOptions: { rejectUnauthorized: false }, // Required for some self-signed certificates
      authTimeout: 3000, // 3 seconds timeout for auth
    });
  }

  private classifyImportance(email: Partial<ParsedEmail>): 'high' | 'medium' | 'low' {
    const subject = email.subject?.toLowerCase() || '';
    const from = email.from?.toLowerCase() || '';
    const text = email.text?.toLowerCase() || '';

    // Check for 3D printing filament sales
    if ((subject.includes('3d') || subject.includes('filament') || subject.includes('sale')) &&
        text.includes('filament')) {
      return 'high';
    }

    // Check for newsletters
    if (
      subject.includes('newsletter') ||
      subject.includes('digest') ||
      subject.includes('weekly') ||
      subject.includes('monthly') ||
      from.includes('newsletter') ||
      from.includes('noreply') ||
      from.includes('no-reply')
    ) {
      return 'low';
    }

    // Check for potential high importance indicators
    if (
      subject.includes('urgent') ||
      subject.includes('important') ||
      subject.includes('action required') ||
      subject.includes('deadline')
    ) {
      return 'high';
    }

    // Default to medium importance
    return 'medium';
  }

  private promisifyImapOnce(event: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      this.imap.once(event, resolve);
      this.imap.once('error', reject);
    });
  }

  private async parseMessage(msg: Imap.ImapMessage): Promise<ParsedEmail> {
    return new Promise((resolve, reject) => {
      let buffer = '';
      
      msg.on('body', (stream: NodeJS.ReadableStream) => {
        stream.on('data', (chunk: Buffer) => {
          buffer += chunk.toString('utf8');
        });

        stream.once('end', async () => {
          try {
            const parsed = await simpleParser(buffer);
            const email: ParsedEmail = {
              subject: parsed.subject || 'No Subject',
              from: parsed.from?.text || 'Unknown',
              date: parsed.date || new Date(),
              text: parsed.text || '',
              html: parsed.html || undefined,
              importance: 'medium', // Will be classified later
            };
            email.importance = this.classifyImportance(email);
            resolve(email);
          } catch (err) {
            reject(err);
          }
        });
      });

      msg.once('error', reject);
    });
  }

  async getUnreadEmails(page = 1, limit = 10): Promise<{ emails: EmailSummary[], total: number }> {
    return new Promise((resolve, reject) => {
      this.imap.once('ready', () => {
        this.imap.openBox('INBOX', false, (err, box) => {
          if (err) {
            this.imap.end();
            reject(err);
            return;
          }

          // Search for unread messages
          this.imap.search(['UNSEEN'], (err, results) => {
            if (err) {
              this.imap.end();
              reject(err);
              return;
            }

            const total = results.length;
            
            // Calculate pagination
            const start = (page - 1) * limit;
            const end = Math.min(start + limit, results.length);
            const pageResults = results.slice(start, end);

            if (pageResults.length === 0) {
              this.imap.end();
              resolve({ emails: [], total });
              return;
            }

            const emails: EmailSummary[] = [];
            const fetch = this.imap.fetch(pageResults, {
              bodies: ['HEADER.FIELDS (FROM SUBJECT DATE)', 'TEXT'],
              size: true,
            });

            fetch.on('message', (msg) => {
              const email: Partial<EmailSummary> = {
                id: '',
                hasAttachments: false,
              };

              msg.on('attributes', (attrs) => {
                email.id = attrs.uid.toString();
                email.hasAttachments = attrs.struct ? this.hasAttachments(attrs.struct) : false;
                email.size = attrs.size || 0;
              });

              msg.on('body', (stream, info) => {
                let buffer = '';
                stream.on('data', (chunk) => {
                  buffer += chunk.toString('utf8');
                });

                stream.once('end', async () => {
                  if (info.which === 'TEXT') {
                    const parsed = await simpleParser(buffer);
                    email.snippet = this.createSnippet(parsed.text || '');
                  } else {
                    const parsed = await simpleParser(buffer);
                    email.subject = parsed.subject || 'No Subject';
                    email.from = parsed.from?.text || 'Unknown';
                    email.date = parsed.date || new Date();
                  }
                });
              });

              msg.once('end', () => {
                if (Object.keys(email).length > 0) {
                  emails.push(email as EmailSummary);
                }
              });
            });

            fetch.once('error', (err) => {
              this.imap.end();
              reject(err);
            });

            fetch.once('end', () => {
              this.imap.end();
              resolve({ emails, total });
            });
          });
        });
      });

      this.imap.once('error', (err) => {
        reject(err);
      });

      this.imap.connect();
    });
  }

  private createSnippet(text: string, maxLength = 200): string {
    if (!text) return '';
    const cleaned = text.replace(/\s+/g, ' ').trim();
    return cleaned.length > maxLength ? `${cleaned.substring(0, maxLength)}...` : cleaned;
  }

  private hasAttachments(struct: any[]): boolean {
    for (const item of struct) {
      if (Array.isArray(item)) {
        if (this.hasAttachments(item)) return true;
      } else if (item && item.disposition && item.disposition.type.toLowerCase() === 'attachment') {
        return true;
      }
    }
    return false;
  }
} 