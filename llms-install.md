# OSHA Compliance MCP Server - Agent Install Guide

## Quick Install

```bash
npm install -g osha-mcp-server
```

Or clone and run:
```bash
git clone https://github.com/danzusholdingsllc/osha-mcp
cd osha-mcp
npm install
npm run build
npm start
```

## Configuration

Environment variables required:
- `SUPABASE_URL` - Your Supabase project URL (e.g., https://xxxx.supabase.co)
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key

## MCP Tools Provided

| Tool | Description |
|------|-------------|
| `lookup_standard` | Search 29 CFR 1910 & 1926 by topic, keyword, or standard number. Returns plain-English summary, key requirements, PPE requirements, and eCFR link. |
| `get_ppe_requirements` | Get PPE requirements for a specific task or hazard. |
| `get_penalty_info` | Current OSHA penalty amounts by violation type (serious, willful, repeat, etc.). |
| `check_applicability` | Determine which OSHA standards apply to a given industry or task. |
| `get_standard_text` | Full regulatory text for a specific standard number. |

## Usage

```
npx osha-mcp-server
```

Or with environment variables:
```bash
SUPABASE_URL=https://your-project.supabase.co \
SUPABASE_ANON_KEY=your-anon-key \
npm start
```

## Database Setup

Run the setup script in your Supabase SQL Editor:
```bash
npx tsx scripts/setup-db.ts
```

Then ingest the OSHA data:
```bash
npx tsx scripts/ingest-standards.ts
npx tsx scripts/generate-summaries.ts
npx tsx scripts/seed-penalties.ts
```

## License

MIT - DANZUS Holdings LLC 2026
