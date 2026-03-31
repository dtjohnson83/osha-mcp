import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js'
import { supabase } from '../lib/supabase'

// Tool definitions
const tools: Tool[] = [
  {
    name: 'get_osha_violations',
    description: 'Get OSHA violation records from the database',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of records to return',
          default: 50
        },
        employer_id: {
          type: 'string',
          description: 'Filter by employer ID'
        }
      }
    }
  },
  {
    name: 'get_osha_inspections',
    description: 'Get OSHA inspection records',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of records to return',
          default: 50
        },
        site_address: {
          type: 'string',
          description: 'Filter by site address (partial match)'
        }
      }
    }
  },
  {
    name: 'get_compliance_status',
    description: 'Get compliance status for an employer',
    inputSchema: {
      type: 'object',
      properties: {
        employer_id: {
          type: 'string',
          description: 'The employer ID to check'
        }
      },
      required: ['employer_id']
    }
  }
]

// Tool implementations
async function handleToolCall(name: string, args: Record<string, unknown>) {
  switch (name) {
    case 'get_osha_violations': {
      const { limit = 50, employer_id } = args
      let query = supabase.from('osha_violations').select('*').limit(limit as number)
      if (employer_id) {
        query = query.eq('employer_id', employer_id)
      }
      const { data, error } = await query
      if (error) throw error
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    }

    case 'get_osha_inspections': {
      const { limit = 50, site_address } = args
      let query = supabase.from('osha_inspections').select('*').limit(limit as number)
      if (site_address) {
        query = query.ilike('site_address', `%${site_address}%`)
      }
      const { data, error } = await query
      if (error) throw error
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    }

    case 'get_compliance_status': {
      const { employer_id } = args
      const { data, error } = await supabase
        .from('compliance_status')
        .select('*')
        .eq('employer_id', employer_id)
        .single()
      if (error) throw error
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    }

    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}

// Create and start server
const server = new Server(
  { name: 'osha-mcp', version: '1.0.0' },
  {
    capabilities: {
      tools: {
        listChanged: true
      }
    }
  }
)

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools }
})

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params
    const result = await handleToolCall(name, args || {})
    return result
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
      isError: true
    }
  }
})

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('OSHA MCP server running on stdio')
}

main().catch(console.error)
