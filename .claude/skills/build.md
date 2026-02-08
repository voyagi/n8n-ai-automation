# Build & Fix Skill

## Serve the Form

```bash
npm run dev
```

Opens at http://localhost:3000

## Start n8n

```bash
npm run n8n
```

Opens at http://localhost:5678

## Lint & Format

```bash
npm run check    # Biome check (lint + format)
npm run lint     # Biome lint only
npm run format   # Biome format only
```

## Common Issues

- **n8n first run**: Creates `.n8n/` directory for config and DB. This is gitignored.
- **Webhook URL**: After importing the workflow, copy the webhook URL from the Webhook node and update `public/script.js`.
- **OpenAI node**: Requires adding OpenAI credentials in n8n UI under Settings → Credentials.
