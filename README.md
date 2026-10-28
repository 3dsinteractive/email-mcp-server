# Email MCP Server

An MCP server with one tool, `send_email`, served over the Streamable HTTP transport. With no environment variables set, it starts in safe mock mode and simulates email creation without sending anything.

## Requirements

Node.js 20 or later.

## Install and run

```sh
npm install
npm start
```

The MCP endpoint is `http://localhost:3000/mcp`. The health endpoint is `http://localhost:3000/healthz`.

## Run with Docker

Build the image:

```sh
docker compose build
```

The Compose configuration defaults to safe mock mode. Start the HTTP server with:

```sh
docker compose up --build
```

Connect an MCP client to `http://localhost:3000/mcp`. For example, an MCP client configuration that supports remote Streamable HTTP can use:

```json
{
  "mcpServers": {
    "email-mcp": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

To send real email, set `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS` in the environment or in a local `.env` file before starting the server. Leave `SMTP_HOST` unset to use mock mode. Keep `.env` private; it is excluded from the Docker build context.

## Configuration

| Variable | SMTP mode | Mock mode |
| --- | --- | --- |
| `SMTP_HOST` | Optional SMTP hostname | Default if unset; `mock` (case insensitive) |
| `SMTP_PORT` | Optional, default `587` | Ignored |
| `SMTP_SECURE` | Optional, `true` or `false`; default `false` | Ignored |
| `SMTP_USER` | Required | Optional |
| `SMTP_PASS` | Required | Ignored |
| `SMTP_FROM` | Optional, defaults to `SMTP_USER` | Optional, defaults to `SMTP_USER` or `mock@example.com` |

The HTTP server listens on `0.0.0.0:3000` by default. Optional `HOST` and `PORT` variables change the bind address and port.

Mock mode never opens an SMTP connection. Nodemailer generates the full email in memory; the tool returns a realistic SMTP-style success result with `accepted`, `rejected`, `envelope`, and a simulated `250` response, plus `preview` containing the generated message. Its `status` remains `"simulated"` so mock activity cannot be mistaken for real delivery. SMTP mode returns `status: "sent"` only after the SMTP server accepts the message. This does not guarantee delivery to the recipient's inbox.

## Tool

`send_email` accepts:

```json
{
  "to": "recipient@example.com",
  "subject": "Hello",
  "text": "This is a test email.",
  "html": "<p>This is a test email.</p>"
}
```

`html` is optional. `to` must be one email address; `subject` must be nonempty; `text` may be empty.

## Claude Desktop example

Use an absolute path to this project's `src/index.js`:

```json
{
  "mcpServers": {
    "email-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-send-email/src/index.js"],
      "env": {
        "SMTP_HOST": "mock",
        "SMTP_FROM": "sender@example.com"
      }
    }
  }
}
```

For real delivery, change `SMTP_HOST` to your SMTP hostname and set `SMTP_USER` and `SMTP_PASS`. Set `SMTP_PORT`, `SMTP_SECURE`, and `SMTP_FROM` as needed.
