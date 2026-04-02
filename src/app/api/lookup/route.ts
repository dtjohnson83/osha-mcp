/**
 * OSHA Agent API - x402 Endpoint
 * 
 * Free tier: 3 lookups per IP per day (no auth required)
 * Paid tier: $0.01 per call via x402 (Base network)
 * Price: $0.01 per lookup
 */

import { NextRequest, NextResponse } from 'next/server'

const RECEIVING_ADDRESS = '0x1cde2a1df9c3747b550fdea1558b093e8d0188e1'
const FREE_DAILY_LIMIT = 3

function getSupabaseConfig() {
  return {
    url: (process.env.SB_URL || process.env.SUPABASE_URL || '').trim(),
    key: (process.env.SB_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim()
  }
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIP = request.headers.get('x-real-ip')
  if (realIP) return realIP
  return '127.0.0.1'
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
  
  const json = await response.json()
  // Normalize: Supabase REST returns array for queries. 
  // If it's {"0": {...}} (single-keyed object), convert to [item]
  if (json && typeof json === 'object' && !Array.isArray(json) && Object.keys(json).every(k => /^\d+$/.test(k))) {
    return Object.values(json)
  }
  return json
}

// REST-based keyword search (fallback when RPC is unavailable)
async function restKeywordSearch(searchQuery: string, scope: string | null, limit: number) {
  const { url, key } = getSupabaseConfig()
  const baseUrl = url.endsWith('/') ? url : url + '/'
  const encoded = encodeURIComponent(searchQuery)
  const orClause = `or=(title.ilike.*${encoded}*,plain_summary.ilike.*${encoded}*,standard_number.ilike.*${encoded}*)`
  const scopeFilter = scope && scope !== 'both' ? `&scope=eq.${scope}` : ''
  const urlStr = `${baseUrl}rest/v1/osha_standards?${orClause}${scopeFilter}&limit=${limit}&select=standard_number,title,subpart,scope,plain_summary,key_requirements,ppe_requirements,ecfr_url,common_violations`
  
  const response = await fetch(urlStr, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
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

async function checkFreeQuota(ip: string, tool: string): Promise<{ allowed: boolean; remaining: number; message?: string }> {
  try {
    const result = await supabaseRpc('check_free_quota', { req_ip: ip, req_tool: tool })
    if (result && typeof result.allowed === 'boolean') {
      return result
    }
    // If RPC fails, allow (fail open for free tier)
    return { allowed: true, remaining: FREE_DAILY_LIMIT - 1 }
  } catch {
    // Fail open — if quota check errors, allow the request
    return { allowed: true, remaining: FREE_DAILY_LIMIT - 1 }
  }
}

function paymentRequired(remaining: number) {
  return new NextResponse(
    `Payment Required: $0.01 per lookup via x402\n` +
    `Free tier: ${FREE_DAILY_LIMIT} lookups/day (${remaining} remaining today)\n` +
    `To pay: Send x402 header or use https://pay.chipper.xyz\n` +
    `Pay-To: ${RECEIVING_ADDRESS}`,
    {
      status: 402,
      headers: {
        'Content-Type': 'text/plain',
        'Accept-Payment': 'exact $0.01@eip155:8453',
        'X-402-Price': '$0.01',
        'X-402-Network': 'eip155:8453',
        'X-402-Pay-To': RECEIVING_ADDRESS,
        'X-Free-Remaining': String(remaining),
        'X-Rate-Limit-Reset': '24h'
      }
    }
  )
}

async function executeLookup(body: Record<string, unknown>): Promise<unknown> {
  const { tool, query, scope, employer_id, site_address, standard_number, violation_type, naics_code, industry, task } = body as any
  let result: any

  switch (tool) {
    case 'lookup_standard': {
      const isStandardNumber = /^\d{4}\.\d+/.test(query?.trim() || '')
      if (isStandardNumber) {
        const qr = await supabaseQuery('osha_standards', {
          'select': 'standard_number,title,subpart,scope,plain_summary,key_requirements,ppe_requirements,ecfr_url,common_violations',
          'standard_number': `eq.${query.trim()}`,
          'limit': '1'
        })
        result = Array.isArray(qr) ? qr[0] : qr
      } else {
        // Try RPC first, fall back to REST keyword search
        const rpcResult = await supabaseRpc('search_standards', {
          search_query: query,
          scope_filter: scope !== 'both' ? scope : null,
          result_limit: 5
        })
        // Check if RPC returned valid array
        if (Array.isArray(rpcResult) && rpcResult.length > 0) {
          result = rpcResult
        } else {
          // Fallback to REST-based ilike search
          result = await restKeywordSearch(query, scope !== 'both' ? scope : null, 5)
        }
      }
      break
    }

    case 'get_ppe_requirements': {
      const ppeResult = await supabaseRpc('search_ppe', {
        search_query: query,
        result_limit: 10
      })
      if (Array.isArray(ppeResult) && ppeResult.length > 0) {
        result = ppeResult
      } else {
        // Fallback to REST-based PPE search
        result = await restKeywordSearch(query, null, 10)
      }
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
      // Try NAICS table first if naics_code provided
      const lookupCode = naics_code || (body.naics_code as string) || ''
      if (lookupCode) {
        const naicsResult = await supabaseQuery('naics_standards', {
          'naics_code': `eq.${lookupCode}`,
          'limit': '1'
        })
        if (Array.isArray(naicsResult) && naicsResult.length > 0) {
          result = naicsResult[0]
          break
        }
      }
      // Fall back to standards search
      const searchTerm = lookupCode || industry || task || query || ''
      const appResult = await supabaseRpc('search_standards', {
        search_query: searchTerm,
        scope_filter: null,
        result_limit: 10
      })
      if (Array.isArray(appResult) && appResult.length > 0) {
        result = appResult
      } else {
        result = await restKeywordSearch(searchTerm, null, 10)
      }
      break
    }

    case 'lookup_naics': {
      const code = naics_code || (body.naics_code as string) || ''
      if (!code) {
        result = { error: 'naics_code required' }
        break
      }
      const naicsResult = await supabaseQuery('naics_standards', {
        'naics_code': `eq.${code.trim()}`,
        'limit': '1'
      })
      if (Array.isArray(naicsResult) && naicsResult.length > 0) {
        result = naicsResult[0]
      } else {
        result = { error: `NAICS code ${code} not found. Try: { tool: 'check_applicability', industry: 'welding shop' }` }
      }
      break
    }

    case 'get_standard_text': {
      const qr = await supabaseQuery('osha_standards', {
        'standard_number': `eq.${standard_number}`,
        'limit': '1'
      })
      result = Array.isArray(qr) ? qr[0] : qr
      break
    }

    case 'format_citation': {
      // Return properly formatted OSHA citation
      const sn = (standard_number || query || '').trim()
      const match = sn.match(/^(\d{4})\.?(\d+)(\.\d+)?$/)
      if (!match) {
        return { error: 'Invalid standard number format. Use 1910.134 or 1926.501.' }
      }
      const part = match[1]
      const section = match[2]
      const subsection = match[3] || ''
      const cfrPart = part === '1910' ? '1910' : part
      const cfrTitle = cfrPart === '1910' ? '29 CFR 1910' : '29 CFR 1926'
      return {
        formatted: `${cfrTitle}.${section}${subsection}`,
        short: `${cfrPart}.${section}${subsection}`,
        full: `Title 29, Code of Federal Regulations, Part ${cfrPart}, Section ${section}${subsection}`,
        url: `https://www.ecfr.gov/current/title-29/section-${cfrPart}.${section}${subsection}`
      }
    }

    default:
      return { error: `Unknown tool: ${tool}. Available tools: lookup_standard, get_ppe_requirements, get_penalty_info, check_applicability, get_standard_text, format_citation` }
  }

  return result
}

export async function GET(request: NextRequest) {
  const ip = getClientIP(request)
  const quota = await checkFreeQuota(ip, 'info')
  
  return new NextResponse(
    `OSHA Compliance API — Free ${FREE_DAILY_LIMIT} lookups/day (${quota.remaining} remaining today)\n` +
    `POST to this endpoint with JSON body: { "tool": "lookup_standard", "query": "fall protection" }\n` +
    `Paid: $0.01/call via x402 — Pay-To: ${RECEIVING_ADDRESS}\n` +
    `Tools: lookup_standard, get_ppe_requirements, get_penalty_info, check_applicability, get_standard_text, format_citation`,
    {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'X-Free-Remaining': String(quota.remaining),
        'X-Rate-Limit-Reset': '24h'
      }
    }
  )
}

export async function POST(request: NextRequest) {
  const ip = getClientIP(request)
  const x402Payment = request.headers.get('x402-payment')
  const tool = request.headers.get('x-osha-tool')

  // Parse body for tool name
  let body: Record<string, unknown> = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const requestedTool = (body.tool as string) || tool || 'lookup_standard'

  // Check free quota if no x402 payment
  if (!x402Payment) {
    const quota = await checkFreeQuota(ip, requestedTool)
    if (!quota.allowed) {
      return paymentRequired(quota.remaining)
    }

    try {
      const result = await executeLookup(body)
      
      return NextResponse.json({
        success: true,
        ...(result !== null && typeof result === 'object' && !Array.isArray(result) ? result : { results: result }),
        free: true,
        remaining: quota.remaining,
        timestamp: new Date().toISOString(),
        disclaimer: 'Free tier — for production use, add x402 payment header or visit https://osha-mcp.vercel.app/pricing'
      })
    } catch (error) {
      return NextResponse.json({ error: String(error) }, { status: 500 })
    }
  }

  // Paid x402 request
  try {
    const result = await executeLookup(body)
    return NextResponse.json({
      success: true,
      ...(result !== null && typeof result === 'object' && !Array.isArray(result) ? result : { results: result }),
      paid: true,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export const runtime = 'nodejs'
