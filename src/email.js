import nodemailer from 'nodemailer';

function parsePort(value) {
  const port = value === undefined || value === '' ? 587 : Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('SMTP_PORT must be an integer from 1 to 65535');
  }
  return port;
}

function parseSecure(value) {
  if (value === undefined || value === '') return false;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error('SMTP_SECURE must be true or false');
}

export function createEmailSender(env = process.env) {
  const host = env.SMTP_HOST?.trim() || 'mock';

  const mock = host.toLowerCase() === 'mock';
  const from = env.SMTP_FROM?.trim() || env.SMTP_USER?.trim() || (mock ? 'mock@example.com' : '');
  if (!mock && (!env.SMTP_USER || !env.SMTP_PASS)) {
    throw new Error('SMTP_USER and SMTP_PASS are required for real SMTP');
  }

  const transporter = mock
    ? nodemailer.createTransport({ streamTransport: true, buffer: true, newline: 'unix' })
    : nodemailer.createTransport({
        host,
        port: parsePort(env.SMTP_PORT),
        secure: parseSecure(env.SMTP_SECURE),
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      });

  return {
    mock,
    async send({ to, subject, text, html }) {
      const info = await transporter.sendMail({ from, to, subject, text, ...(html === undefined ? {} : { html }) });
      const envelope = info.envelope ?? { from, to: [to] };
      return {
        status: mock ? 'simulated' : 'sent',
        messageId: info.messageId,
        from,
        to,
        envelope,
        accepted: info.accepted ?? (mock ? [to] : []),
        rejected: info.rejected ?? [],
        response: info.response ?? (mock ? `250 2.0.0 OK: queued as MOCK-${info.messageId}` : undefined),
        ...(mock ? { preview: info.message.toString('utf8') } : {}),
      };
    },
  };
}
