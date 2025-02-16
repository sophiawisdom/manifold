import { HomeIcon } from '@heroicons/react/solid'
import { Col } from 'web/components/layout/col'
import { QueryUncontrolledTabs, Tab } from 'web/components/layout/tabs'
import { track } from 'web/lib/service/analytics'
import { buildArray } from 'common/util/array'
import { NewsDashboard } from './news-dashboard'
import { Dashboard } from 'common/dashboard'
import { LinkPreviews } from 'common/link-preview'

export function NewsTopicsTabs(props: {
  dashboards: Dashboard[]
  previews: LinkPreviews
  homeContent?: JSX.Element
  dontScroll?: boolean
}) {
  const { dashboards, previews, homeContent, dontScroll } = props

  const topics = buildArray<Tab>(
    !!homeContent && {
      title: 'For you',
      inlineTabIcon: <HomeIcon className="h-4 w-4" />,
      content: homeContent,
    },
    dashboards.map((d) => ({
      title: d.title,
      content: <NewsDashboard dashboard={d} previews={previews} />,
    }))
  )
  return (
    <Col className="w-full gap-2 px-1 pb-8 sm:mx-auto sm:gap-6">
      <QueryUncontrolledTabs
        className={'bg-canvas-50 sticky top-0 z-20 px-1'}
        trackingName="news tabs"
        scrollToTop={!dontScroll}
        tabs={topics}
        onClick={(tabTitle) => {
          track('news topic clicked', { tab: tabTitle })
        }}
      />
    </Col>
  )
}
