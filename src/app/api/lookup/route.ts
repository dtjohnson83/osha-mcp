/**
 * OSHA Agent API - x402 Endpoint
 * 
 * Pay-per-call API for OSHA compliance lookups.
 * Price: $0.01 per call
 */

import { NextRequest, NextResponse } from 'next/server'

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

export async function GET(request: NextRequest) {
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

export async function POST(request: NextRequest) {
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

  try {
    const { tool, query, scope, employer_id, site_address, standard_number, violation_type } = await request.json()

    let result: any

    switch (tool) {
      case 'lookup_standard': {
        const isStandardNumber = /^\d{4}\.\d+/.test(query?.trim() || '')
        
        if (isStandardNumber) {
          result = await supabaseQuery('osha_standards', {
            'select': 'standard_number,title,subpart,scope,plain_summary,key_requirements,ppe_requirements,ecfr_url',
            'standard_number': `eq.${query.trim()}`,
            'limit': '1'
          })
        } else {
          result = await supabaseRpc('search_standards', {
            search_query: query,
            scope_filter: scope !== 'both' ? scope : null,
            result_limit: 5
          })
        }
        break
      }

      case 'get_ppe_requirements': {
        result = await supabaseRpc('search_ppe', {
          search_query: query,
          result_limit: 10
        })
        break
      }

      case 'get_osha_violations': {
        result = await supabaseQuery('osha_violations', {
          'limit': '50',
          ...(employer_id ? { 'employer_id': `eq.${employer_id}` } : {})
        })
        break
      }

      case 'get_osha_inspections': {
        result = await supabaseQuery('osha_inspections', {
          'limit': '50',
          ...(site_address ? { 'site_address': `ilike.*${site_address}*` } : {})
        })
        break
      }

      case 'get_compliance_status': {
        result = await supabaseQuery('compliance_status', {
          'employer_id': `eq.${employer_id}`,
          'limit': '1'
        })
        break
      }

      case 'get_penalty_info': {
        result = await supabaseQuery('penalty_schedule', {
          'select': '*',
          'order': 'max_penalty.desc',
          ...(violation_type && violation_type !== 'all' ? { 'violation_type': `eq.${violation_type}` } : {})
        })
        break
      }

      case 'check_applicability': {
        result = await supabaseRpc('search_standards', {
          search_query: query,
          scope_filter: null,
          result_limit: 10
        })
        break
      }

      case 'get_standard_text': {
        result = await supabaseQuery('osha_standards', {
          'standard_number': `eq.${standard_number}`,
          'limit': '1'
        })
        break
      }

      default:
        return NextResponse.json({ error: 'Unknown tool' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      tool,
      result,
      paid: true,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
