import { getPageMap } from 'nextra/page-map'
import type { MetadataRoute } from 'next'

const BASE = 'https://docs.cardinalhq.io'

// required by `output: export`
export const dynamic = 'force-static'

type Item = { route?: string; children?: Item[] }

function routes(items: Item[]): string[] {
  return items.flatMap((i) => [
    ...(i.route && !i.route.includes('[') ? [i.route] : []),
    ...(i.children ? routes(i.children) : []),
  ])
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const all = routes((await getPageMap()) as Item[])
  return Array.from(new Set(all)).sort().map((route) => ({ url: BASE + route }))
}
