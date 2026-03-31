# OSHA Compliance MCP Server

An MCP (Model Context Protocol) server that makes OSHA safety regulations queryable by AI agents. Covers 29 CFR 1910 (General Industry) and 29 CFR 1926 (Construction).

**Owner:** DANZUS Holdings LLC

## Tools

| Tool | Description |
|------|-------------|
| `lookup_standard` | Search standards by topic, keyword, or number |
| `get_ppe_requirements` | PPE requirements for a task or hazard |
| `get_penalty_info` | Current OSHA penalty schedule |
| `check_applicability` | Which standards apply to an industry/task |
| `get_standard_text` | Full regulatory text for a specific standard |

## Setup

### 1. Database

Paste `scripts/setup-db.sql` into Supabase SQL Editor.

### 2. Environment

```bash
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_ANON_KEY
```

### 3. Ingest Data

```bash
npm install
npx tsx scripts/ingest-standards.ts     # Fetch from eCFR
npx tsx scripts/generate-summaries.ts   # Generate plain-English summaries
npx tsx scripts/seed-penalties.ts       # Seed penalty schedule
npx tsx scripts/validate-data.ts        # Verify data quality
```

### 4. Run Server

```bash
npm run build
npm start
```

## Database Schema

Requires the following tables in Supabase:
- `osha_standards` - Standard numbers, titles, text, summaries
- `penalty_schedule` - Current penalty amounts by violation type
- `naics_standards` - NAICS code to standards mapping
- `api_usage` - Tool usage tracking

## Disclaimer

This tool is for informational purposes only and does not constitute legal advice. Always verify requirements with official OSHA sources.

## License

MIT - DANZUS Holdings LLC 2026
