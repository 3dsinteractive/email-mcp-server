# Email MCP Server

An MCP server with one tool, `send_email`. It sends through SMTP, or simulates the same message creation process when `SMTP_HOST=mock`.

## Requirements

Node.js 20 or later.

## Install and run

```sh
npm install
SMTP_HOST=mock npm start
```

The server communicates over stdio. Its stdout is reserved for MCP messages.

## Run with Docker

Build the image:

```sh
docker compose build
```

The Compose configuration defaults to safe mock mode. Start the stdio MCP server with:

```sh
docker compose run --rm email-mcp
```

For a host that launches MCP servers as child processes, build the image once and use Docker's interactive stdio mode:

```json
{
  "mcpServers": {
    "email-mcp": {
      "command": "docker",
      "args": ["run", "--rm", "-i", "-e", "SMTP_HOST=mock", "email-mcp:local"]
    }
  }
}
```

For SMTP delivery, create a local `.env` from `.env.example`, set `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS`, then run `docker compose run --rm email-mcp`. Compose passes the values into the container. Keep `.env` private; it is excluded from the Docker build context.

## Configuration

| Variable | SMTP mode | Mock mode |
| --- | --- | --- |
| `SMTP_HOST` | Required SMTP hostname | Set to `mock` (case insensitive) |
| `SMTP_PORT` | Optional, default `587` | Ignored |
| `SMTP_SECURE` | Optional, `true` or `false`; default `false` | Ignored |
| `SMTP_USER` | Required | Optional |
| `SMTP_PASS` | Required | Ignored |
| `SMTP_FROM` | Optional, defaults to `SMTP_USER` | Optional, defaults to `SMTP_USER` or `mock@example.com` |

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
