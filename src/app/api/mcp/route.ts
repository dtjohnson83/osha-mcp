import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// MCP JSON-RPC message types
interface MCPRequest {
  jsonrpc: '2.0'
  id: number | string | null
  method: string
  params?: {
    name?: string
    arguments?: Record<string, unknown>
  }
}

interface Tool {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties?: Record<string, unknown>
    required?: string[]
  }
}

// Tool implementations
async function handleToolCall(name: string, args: Record<string, unknown>, supabase: ReturnType<typeof createClient>) {
  switch (name) {
    case 'get_osha_violations': {
      const { limit = 50, employer_id } = args
      let query = supabase.from('osha_violations').select('*').limit(limit as number)
      if (employer_id) {
        query = query.eq('employer_id', employer_id)
      }
      const { data, error } = await query
      if (error) throw error
      return data
    }

    case 'get_osha_inspections': {
      const { limit = 50, site_address } = args
      let query = supabase.from('osha_inspections').select('*').limit(limit as number)
      if (site_address) {
        query = query.ilike('site_address', `%${site_address}%`)
      }
      const { data, error } = await query
      if (error) throw error
      return data
    }

    case 'get_compliance_status': {
      const { employer_id } = args
      const { data, error } = await supabase
        .from('compliance_status')
        .select('*')
        .eq('employer_id', employer_id)
        .single()
      if (error) throw error
      return data
    }

    case 'list_tools': {
      return tools
    }

    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}

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

export async function POST(request: NextRequest) {
  try {
    const body: MCPRequest = await request.json()
    const { method, params, id } = body

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (method === 'tools/list') {
      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        result: { tools }
      })
    }

    if (method === 'tools/call') {
      const { name, arguments: args } = params || {}
      if (!name) {
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          error: { code: -32600, message: 'Tool name required' }
        }, { status: 400 })
      }

      try {
        const result = await handleToolCall(name, args || {}, supabase)
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
          }
        })
      } catch (error) {
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32603,
            message: error instanceof Error ? error.message : String(error)
          }
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: 'Method not found' }
    }, { status: 404 })
  } catch (error) {
    return NextResponse.json({
      jsonrpc: '2.0',
      error: { code: -32700, message: 'Parse error' }
    }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'osha-mcp',
    version: '1.0.0',
    description: 'MCP server for OSHA compliance and safety data',
    tools: tools.map(t => ({ name: t.name, description: t.description }))
  })
}
