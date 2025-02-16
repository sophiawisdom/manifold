import { useMemo } from 'react'
import { last } from 'lodash'
import { scaleTime, scaleLog, scaleLinear } from 'd3-scale'
import { getInitialProbability, getProbability } from 'common/calculate'
import { formatLargeNumber } from 'common/util/format'
import { PseudoNumericContract } from 'common/contract'
import { NUMERIC_GRAPH_COLOR } from 'common/numeric-constants'
import {
  TooltipProps,
  getDateRange,
  getRightmostVisibleDate,
  formatDateInRange,
} from '../helpers'
import { ControllableSingleValueHistoryChart } from '../generic-charts'
import { Row } from 'web/components/layout/row'
import { Avatar } from 'web/components/widgets/avatar'
import { HistoryPoint, viewScale } from 'common/chart'

// mqp: note that we have an idiosyncratic version of 'log scale'
// contracts. the values are stored "linearly" and can include zero.
// as a result, we have to do some weird-looking stuff in this code

const getScaleP = (min: number, max: number, isLogScale: boolean) => {
  return (p: number) =>
    isLogScale
      ? 10 ** (p * Math.log10(max - min + 1)) + min - 1
      : p * (max - min) + min
}

// same as BinaryPoint
type NumericPoint = HistoryPoint<{ userAvatarUrl?: string }>

const getBetPoints = (bets: NumericPoint[], scaleP: (p: number) => number) => {
  return bets.map((pt) => ({ x: pt.x, y: scaleP(pt.y), obj: pt.obj }))
}

const PseudoNumericChartTooltip = (
  props: TooltipProps<NumericPoint> & { dateLabel: string }
) => {
  const { prev, next, dateLabel } = props
  if (!prev) return null

  return (
    <Row className="items-center gap-2">
      {prev.obj?.userAvatarUrl && (
        <Avatar size="xs" avatarUrl={prev.obj.userAvatarUrl} />
      )}
      <span className="font-semibold">{next ? dateLabel : 'Now'}</span>
      <span className="text-ink-600">{formatLargeNumber(prev.y)}</span>
    </Row>
  )
}

export const PseudoNumericContractChart = (props: {
  contract: PseudoNumericContract
  betPoints: NumericPoint[]
  width: number
  height: number
  viewScaleProps: viewScale
  showZoomer?: boolean
  controlledStart?: number
  onMouseOver?: (p: NumericPoint | undefined) => void
}) => {
  const {
    contract,
    width,
    height,
    viewScaleProps,
    showZoomer,
    controlledStart,
    onMouseOver,
  } = props
  const { min, max, isLogScale } = contract
  const [start, end] = getDateRange(contract)
  const rangeStart = controlledStart ?? start
  const scaleP = useMemo(
    () => getScaleP(min, max, isLogScale),
    [min, max, isLogScale]
  )
  const startP = scaleP(getInitialProbability(contract))
  const endP = scaleP(getProbability(contract))
  const betPoints = useMemo(
    () => getBetPoints(props.betPoints, scaleP),
    [props.betPoints, scaleP]
  )

  const now = useMemo(() => Date.now(), [betPoints])

  const data = useMemo(
    () => [{ x: start, y: startP }, ...betPoints, { x: end ?? now, y: endP }],
    [betPoints, start, startP, end, endP]
  )
  const rightmostDate = getRightmostVisibleDate(end, last(betPoints)?.x, now)
  const xScale = scaleTime([rangeStart, rightmostDate], [0, width])
  // clamp log scale to make sure zeroes go to the bottom
  const yScale = isLogScale
    ? scaleLog([Math.max(min, 1), max], [height, 0]).clamp(true)
    : scaleLinear([min, max], [height, 0])
  return (
    <ControllableSingleValueHistoryChart
      w={width}
      h={height}
      xScale={xScale}
      yScale={yScale}
      viewScaleProps={viewScaleProps}
      showZoomer={showZoomer}
      data={data}
      onMouseOver={onMouseOver}
      Tooltip={(props) => (
        <PseudoNumericChartTooltip
          {...props}
          dateLabel={formatDateInRange(
            // eslint-disable-next-line react/prop-types
            xScale.invert(props.x),
            rangeStart,
            rightmostDate
          )}
        />
      )}
      color={NUMERIC_GRAPH_COLOR}
    />
  )
}
