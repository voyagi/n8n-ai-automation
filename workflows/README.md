# n8n Workflow Import

## How to import

1. Start n8n: `npm run n8n`
2. Open http://localhost:5678
3. Go to Workflows
4. Click Import from File
5. Select `contact-form-ai.json`
6. Configure credentials:
   - OpenAI: Add your API key in Settings > Credentials > OpenAI API
   - Slack: Add incoming webhook URL in the Slack node
7. Activate the workflow
8. Copy the webhook URL from the Webhook node and update `public/script.js`

## Workflow nodes

The workflow JSON will be created during development. It contains:

- Webhook trigger (receives form POST)
- Set node (extracts fields)
- OpenAI node (sentiment + category + summary + draft reply)
- Switch node (routes spam vs. legitimate)
- Google Sheets / Supabase node (saves processed data)
- Slack node (sends notification)
