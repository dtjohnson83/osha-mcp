# OSHA MCP

MCP server for OSHA compliance and safety data.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set environment variables in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Run as stdio MCP server:
   ```bash
   npm run mcp:stdio
   ```

## MCP Tools

- `get_osha_violations` - Get OSHA violation records
- `get_osha_inspections` - Get OSHA inspection records
- `get_compliance_status` - Get compliance status for an employer

## Deploy

Deploy to Vercel:

```bash
vercel
```

## Supabase Schema

Run the schema in `supabase/schema.sql` to create the required tables.
