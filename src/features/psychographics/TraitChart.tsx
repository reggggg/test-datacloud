import type { CSSProperties } from 'react'
import { indexLabel, overlapPercent, type TraitGroup } from './measurements'

type Props = {
  groups: TraitGroup[]
  colors: Map<string, string>
  showOverlap: boolean
}

export function TraitChart({ groups, colors, showOverlap }: Props) {
  const maxIndex = groups.reduce((max, group) =>
    group.measurements.reduce((largest, row) => Math.max(largest, Math.abs(row.index_pct)), max), 0)
  const step = maxIndex > 100 ? 10 ** Math.floor(Math.log10(maxIndex)) / 2 : 25
  const limit = Math.max(step, Math.ceil(maxIndex / step) * step)
  const ticks = [-limit, -limit / 2, 0, limit / 2, limit]

  return <div className="psy-chart-scroll" role="region" aria-label="Diverging index chart" tabIndex={0}>
    <div className={`psy-chart-layout${showOverlap ? ' with-overlap' : ''}`}>
      <div className="psy-chart-head">
        <span>Trait</span>
        <div className="psy-axis-head">
          <span>Below baseline</span><span className="psy-baseline-tag">Network baseline</span><span>Above baseline</span>
        </div>
        {showOverlap && <span className="psy-overlap">Overlap</span>}
      </div>
      {groups.map(group => <div key={group.trait} className="psy-chart-group">
        <div className="psy-trait-label">{group.trait}</div>
        <div className="psy-chart-series">
          {group.measurements.map(row => {
            const width = Math.abs(row.index_pct) / limit * 50
            const negative = row.index_pct < 0
            const color = colors.get(row.segment_name) ?? '#365de8'
            const style = {
              '--series-color': color,
              '--bar-width': `${width}%`,
              '--bar-start': `${negative ? 50 - width : 50}%`,
              '--bar-end': `${negative ? 50 - width : 50 + width}%`,
            } as CSSProperties
            const overlap = overlapPercent.format(row.overlap_pct) + '%'
            const label = indexLabel(row.index_pct)
            return <div className="psy-series-row" key={row.segment_name} style={style}>
              <div
                className={`psy-plot${negative ? ' negative' : ''}${width >= 16 ? ' label-inside' : ''}`}
                title={`${row.trait_name} · ${row.segment_name} · Index ${label} · Overlap ${overlap}`}
              >
                <span className="psy-sr-only">{row.segment_name}, index </span>
                <span className={`psy-bar${width ? '' : ' is-zero'}`} aria-hidden="true" />
                <span className="psy-index-value">{label}</span>
              </div>
              {showOverlap && <div className="psy-overlap">{overlap}</div>}
            </div>
          })}
        </div>
      </div>)}
      <div className="psy-chart-axis">
        <span />
        <div>{ticks.map(tick => <span key={tick}>{indexLabel(tick)}</span>)}</div>
      </div>
    </div>
  </div>
}

export function TraitTable({ groups, colors, showOverlap }: Props) {
  return <div className="psy-chart-scroll" role="region" aria-label="Psychographic data table" tabIndex={0}>
    <table className="psy-data-table">
      <thead><tr>
        <th scope="col">Trait</th><th scope="col">Category</th><th scope="col">Segment</th>
        <th scope="col">Index</th>{showOverlap && <th scope="col">Overlap</th>}
      </tr></thead>
      <tbody>{groups.flatMap(group => group.measurements.map(row => <tr key={JSON.stringify([row.trait_name, row.segment_name])}>
        <th scope="row">{row.trait_name}</th><td>{row.category}</td>
        <td><span className="psy-dot" style={{ backgroundColor: colors.get(row.segment_name) }} />{row.segment_name}</td>
        <td>{indexLabel(row.index_pct)}</td>
        {showOverlap && <td>{overlapPercent.format(row.overlap_pct)}%</td>}
      </tr>))}</tbody>
    </table>
  </div>
}
