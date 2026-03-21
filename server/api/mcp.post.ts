import { calculateHealth, scoreToStatus } from '../utils/health'

// Tool definitions for MCP discovery
const TOOLS = [
  {
    name: 'module_search',
    description: 'Search for Nuxt modules by keyword. Returns matching modules with health score, status, install command, downloads and stars. Use this to find and recommend modules.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term like "forms", "auth", "i18n", "image"' },
        limit: { type: 'number', description: 'Max results (default 5, max 10)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'module_health',
    description: 'Get detailed health information for a specific Nuxt module. Returns score breakdown, all signals with points, version, vulnerabilities, trend data. Use this to evaluate if a module is safe to use.',
    inputSchema: {
      type: 'object',
      properties: {
        module: { type: 'string', description: 'Module name like "pinia", "i18n", "image"' },
      },
      required: ['module'],
    },
  },
]

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // MCP uses JSON-RPC 2.0
  const { method, params, id } = body

  // Discovery: which tools are available?
  if (method === 'tools/list') {
    return { jsonrpc: '2.0', id, result: { tools: TOOLS } }
  }

  // Execution: run a specific tool
  if (method === 'tools/call') {
    const { name, arguments: args } = params

    if (name === 'module_search') {
      return { jsonrpc: '2.0', id, result: await handleModuleSearch(args) }
    }

    if (name === 'module_health') {
      return { jsonrpc: '2.0', id, result: await handleModuleHealth(args) }
    }

    return { jsonrpc: '2.0', id, error: { code: -32602, message: `Unknown tool: ${name}` } }
  }

  // Unknown method
  return { jsonrpc: '2.0', id, error: { code: -32601, message: `Unknown method: ${method}` } }
})

async function handleModuleSearch(args: { query: string, limit?: number }) {
  const query = args.query.toLowerCase()
  const limit = Math.min(args.limit ?? 5, 10)

  const allModules = await kv.get<ModuleData[]>('modules:all')
  if (!allModules) {
    return { content: [{ type: 'text', text: 'No module data available. Try again later.' }] }
  }

  // Search by name, description, category, keywords
  const matches = allModules
    .map((mod: ModuleData) => {
      const health = calculateHealth(mod)
      let relevance = 0
      if (mod.name.includes(query)) relevance += 10
      if (mod.description?.toLowerCase().includes(query)) relevance += 5
      if (mod.category?.toLowerCase().includes(query)) relevance += 3
      if (mod.npm?.keywords?.some((k: string) => k.toLowerCase().includes(query))) relevance += 3
      return { mod, health, relevance }
    })
    .filter((m: { relevance: number }) => m.relevance > 0)
    .sort((a: { relevance: number, health: HealthScore }, b: { relevance: number, health: HealthScore }) => b.relevance - a.relevance || b.health.score - a.health.score)
    .slice(0, limit)

  if (matches.length === 0) {
    return { content: [{ type: 'text', text: `No modules found for "${args.query}".` }] }
  }

  const results = matches.map(({ mod, health }: { mod: ModuleData, health: HealthScore }, i: number) => {
    const status = scoreToStatus(health.score)
    return [
      `${i + 1}. **${mod.name}** (${health.score}/100 - ${status})`,
      `   ${mod.description}`,
      `   Install: \`npx nuxt module add ${mod.name}\``,
      `   npm: ${mod.npmPackage} | Downloads: ${formatNum(mod.npm?.downloads)} | Stars: ${formatNum(mod.github?.stars)}`,
      `   Type: ${mod.type} | Category: ${mod.category}`,
    ].join('\n')
  })

  return {
    content: [{
      type: 'text',
      text: `Found ${matches.length} module${matches.length > 1 ? 's' : ''} for "${args.query}":\n\n${results.join('\n\n')}`,
    }],
  }
}

async function handleModuleHealth(args: { module: string }) {
  const allModules = await kv.get<ModuleData[]>('modules:all')
  if (!allModules) {
    return { content: [{ type: 'text', text: 'No module data available. Try again later.' }] }
  }

  const mod = allModules.find((m: ModuleData) => m.name === args.module)
  if (!mod) {
    return { content: [{ type: 'text', text: `Module "${args.module}" not found.` }] }
  }

  const health = calculateHealth(mod)
  const status = scoreToStatus(health.score)

  const signals = health.signals
    .filter(s => s.maxPoints > 0 || s.points < 0)
    .map(s => `  ${s.points >= 0 ? '+' : ''}${s.points}/${s.maxPoints} ${s.msg}`)
    .join('\n')

  const info = health.signals
    .filter(s => s.maxPoints === 0 && s.points === 0)
    .map(s => `  ${s.msg}`)
    .join('\n')

  const history = await getModuleHistory(mod.name, { days: 30 })
  let trend = ''
  if (history && history.snapshots.length >= 2) {
    const first = history.snapshots[0]!
    const last = history.snapshots[history.snapshots.length - 1]!
    const diff = last.score - first.score
    trend = `\nTrend (${history.snapshots.length}d): ${first.score} → ${last.score} (${diff >= 0 ? '+' : ''}${diff})`
  }

  const text = [
    `**${mod.name}** — ${health.score}/100 (${status})`,
    `${mod.description}`,
    ``,
    `Install: \`npx nuxt module add ${mod.name}\``,
    `Package: ${mod.npmPackage} v${mod.npm?.latestVersion ?? '?'}`,
    `Type: ${mod.type} | Category: ${mod.category}`,
    ``,
    `Score breakdown:`,
    signals,
    ``,
    `Info:`,
    info,
    trend,
    mod.vulnerabilities && mod.vulnerabilities.count > 0
      ? `\nVulnerabilities: ${mod.vulnerabilities.count} (${mod.vulnerabilities.critical} critical, ${mod.vulnerabilities.high} high)`
      : '',
  ].filter(Boolean).join('\n')

  return { content: [{ type: 'text', text }] }
}

function formatNum(n: number | null | undefined): string {
  if (n == null) return '-'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return String(n)
}
