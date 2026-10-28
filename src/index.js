import { McpServer } from '@modelcontextprotocol/server';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { toNodeHandler } from '@modelcontextprotocol/node';
import { createServer as createHttpServer } from 'node:http';
import * as z from 'zod/v4';
import { createEmailSender } from './email.js';

const sender = createEmailSender();

function createMcpServer() {
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
}

const mcpHandler = createMcpHandler(createMcpServer);
const handleMcpRequest = toNodeHandler(mcpHandler);
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';

const httpServer = createHttpServer(async (request, response) => {
  const pathname = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`).pathname;

  if (pathname === '/healthz' && request.method === 'GET') {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ status: 'ok', mode: sender.mock ? 'mock' : 'smtp' }));
    return;
  }

  if (pathname !== '/mcp') {
    response.writeHead(404, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ error: 'Not found. MCP endpoint: /mcp' }));
    return;
  }

  try {
    await handleMcpRequest(request, response);
  } catch (error) {
    if (!response.headersSent) response.writeHead(500, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ error: error.message }));
  }
});

httpServer.listen(port, host, () => {
  console.error(`Email MCP server listening at http://${host}:${port}/mcp (${sender.mock ? 'mock mode' : 'SMTP mode'})`);
});
