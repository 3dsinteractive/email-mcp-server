import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';
import { createEmailSender } from './email.js';

const sender = createEmailSender();

serveStdio(() => {
  const server = new McpServer({ name: 'email-mcp', version: '1.0.0' });
  server.registerTool(
    'send_email',
    {
      description: sender.mock
        ? 'Simulate sending an email. No network delivery occurs; returns the generated message.'
        : 'Send an email through the configured SMTP server.',
      inputSchema: z.object({
        to: z.email().describe('Recipient email address'),
        subject: z.string().min(1).describe('Email subject'),
        text: z.string().describe('Plain text email body'),
        html: z.string().optional().describe('Optional HTML email body'),
      }),
    },
    async (args) => {
      try {
        const result = await sender.send(args);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Email delivery failed: ${error.message}` }],
        };
      }
    },
  );
  return server;
});
