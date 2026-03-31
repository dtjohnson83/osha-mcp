/**
 * MCP HTTP Endpoint for Smithery
 * 
 * Implements MCP over HTTP transport for Smithery URL publishing.
 * GET /api/mcp - List tools
 * POST /api/mcp - Call tool
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const RECEIVING_ADDRESS = '0x0b55C77eDC2592e38eBd008F82Cce694d3c49475'

function getSupabaseConfig() {
  return {
    url: (process.env.SB_URL || '').trim(),
    key: (process.env.SB_ANON_KEY || '').trim()
  }
}

async function supabaseQuery(table: string, params: Record<string, string> = {}) {
  const { url, key } = getSupabaseConfig()
  const baseUrl = url.endsWith('/') ? url : url + '/'
  const u = new URL(`${baseUrl}rest/v1/${table}`)
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v))
  
  const response = await fetch(u.toString(), {
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`
    }
  })
  
  return response.json()
}

async function supabaseRpc(functionName: string, params: Record<string, unknown>) {
  const { url, key } = getSupabaseConfig()
  const baseUrl = url.endsWith('/') ? url : url + '/'
  const response = await fetch(`${baseUrl}rest/v1/rpc/${functionName}`, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  })
  
  return response.json()
}

const tools = [
  {
    name: 'lookup_standard',
    description: 'Search OSHA safety standards by topic, keyword, hazard, or standard number (e.g., "fall protection", "1926.501", "confined space", "respirator"). Returns plain-English summaries with official citations. Covers 29 CFR 1910 (General Industry) and 1926 (Construction).',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term: topic, keyword, hazard, or standard number' },
        scope: { type: 'string', description: 'Filter by scope', enum: ['general_industry', 'construction', 'both'], default: 'both' }
      },
      required: ['query']
    }
  },
  {
    name: 'get_ppe_requirements',
    description: 'Get required Personal Protective Equipment (PPE) for a specific work task or hazard, with OSHA standard citations.',
    inputSchema: {
      type: 'object',
      properties: {
        task: { type: 'string', description: 'Description of the work task' }
      },
      required: ['task']
    }
  },
  {
    name: 'get_penalty_info',
    description: 'Get current OSHA penalty amounts by violation type (serious, willful, repeat, other-than-serious, failure-to-abate, posting requirements).',
    inputSchema: {
      type: 'object',
      properties: {
        violation_type: { type: 'string', description: 'Type of violation, or "all" for complete schedule', default: 'all' }
      }
    }
  },
  {
    name: 'check_applicability',
    description: 'Determine which OSHA standards apply to a specific industry, task, or work scenario.',
    inputSchema: {
      type: 'object',
      properties: {
        industry: { type: 'string', description: 'Industry description (e.g., "commercial construction", "manufacturing")' },
        task: { type: 'string', description: 'Specific task (e.g., "trenching and excavation", "spray painting")' }
      }
    }
  },
  {
    name: 'get_standard_text',
    description: 'Get the full regulatory text of a specific OSHA standard by its number (e.g., "1910.134", "1926.501").',
    inputSchema: {
      type: 'object',
      properties: {
        standard_number: { type: 'string', description: 'OSHA standard number (e.g., "1910.134", "1926.501")' }
      },
      required: ['standard_number']
    }
  }
]

async function handleToolCall(name: string, arguments_: Record<string, unknown> = {}) {
  switch (name) {
    case 'lookup_standard': {
      const { query, scope } = arguments_ as { query: string; scope?: string }
      const isStandardNumber = /^\d{4}\.\d+/.test(query?.trim() || '')
      
      if (isStandardNumber) {
        return await supabaseQuery('osha_standards', {
          'select': 'standard_number,title,subpart,scope,plain_summary,key_requirements,ppe_requirements,ecfr_url',
          'standard_number': `eq.${query.trim()}`,
          'limit': '1'
        })
      } else {
        return await supabaseRpc('search_standards', {
          search_query: query,
          scope_filter: scope !== 'both' ? scope : null,
          result_limit: 5
        })
      }
    }

    case 'get_ppe_requirements': {
      const { task } = arguments_ as { task: string }
      return await supabaseRpc('search_ppe', {
        search_query: task,
        result_limit: 10
      })
    }

    case 'get_penalty_info': {
      const { violation_type } = arguments_ as { violation_type?: string }
      return await supabaseQuery('penalty_schedule', {
        'select': '*',
        'order': 'max_penalty.desc',
        ...(violation_type && violation_type !== 'all' ? { 'violation_type': `eq.${violation_type}` } : {})
      })
    }

    case 'check_applicability': {
      const { industry, task } = arguments_ as { industry?: string; task?: string }
      const query = industry || task || ''
      return await supabaseRpc('search_standards', {
        search_query: query,
        scope_filter: null,
        result_limit: 10
      })
    }

    case 'get_standard_text': {
      const { standard_number } = arguments_ as { standard_number: string }
      return await supabaseQuery('osha_standards', {
        'standard_number': `eq.${standard_number}`,
        'limit': '1'
      })
    }

    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}

// GET - List tools (for MCP discovery - no payment required)
export async function GET() {
  return NextResponse.json({
    jsonrpc: '2.0',
    result: { tools }
  })
}

// POST - Call tool (requires payment via x402)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { method, params, id } = body

    // Discovery and initialization methods don't require payment
    if (method === 'initialize') {
      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          serverInfo: { name: 'osha-mcp', version: '1.0.0' },
          capabilities: { tools: {} }
        }
      })
    }
    
    if (method === 'tools/list' || method === 'ping') {
      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        result: { tools }
      })
    }

    // All other methods require x402 payment
    const x402Payment = request.headers.get('x402-payment')
    if (!x402Payment) {
      return new NextResponse('Payment Required: $0.01 per lookup via x402', {
        status: 402,
        headers: {
          'Content-Type': 'text/plain',
          'Accept-Payment': 'exact $0.01@eip155:8453',
          'X-402-Price': '$0.01',
          'X-402-Network': 'eip155:8453',
          'X-402-Pay-To': RECEIVING_ADDRESS
        }
      })
    }

    if (method === 'tools/call') {
      const { name, arguments: args } = params || {}
      
      try {
        const result = await handleToolCall(name, args || {})
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
            message: String(error)
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

export const runtime = 'nodejs'
