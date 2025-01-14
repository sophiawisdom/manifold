import { GetServerSideProps } from 'next'
import { getServerSideSitemap, ISitemapField } from 'next-sitemap'
import { searchContract } from 'web/lib/supabase/contracts'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const contracts = await searchContract({
    query: '',
    filter: 'all',
    sort: 'score',
    limit: 1000,
  }).then((x) => x.data)

  const score = (index: number) => (1 - index / 1000) * 0.3 + 0.4

  const fields = contracts.map((market, i) => ({
    loc: `https://manifold.markets/${market.creatorUsername}/${market.slug}`,
    changefreq: market.volume24Hours > 10 ? 'hourly' : 'daily',
    priority: score(i),
    lastmod: new Date(market.lastUpdatedTime ?? 0).toISOString(),
  })) as ISitemapField[]

  return await getServerSideSitemap(ctx, fields)
}

// Default export to prevent next.js errors
export default function Sitemap() {}
