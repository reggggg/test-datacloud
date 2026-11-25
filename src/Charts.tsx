import { useId, useMemo } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartNoAxesCombined, CircleHelp } from 'lucide-react'
import { amount, costByMonth, money, textValue, type Resource } from './data'

const colors = ['#d9592e', '#eca17d', '#eecbb2', '#5f6954', '#7d6d8e', '#6d8798']
const axisMoney = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 })
const pct = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 0 })

export default function Charts({ resources, months, now, hasTrend }: {
  resources: Resource[]
  months: number
  now: Date
  hasTrend: boolean
}) {
  return <div className="chart-grid">
    {hasTrend ? <CostChart resources={resources} months={months} now={now} /> : <ServiceCostChart resources={resources} />}
    <BreakdownChart resources={resources} />
  </div>
}

function CostChart({ resources, months, now }: { resources: Resource[]; months: number; now: Date }) {
  const gradient = useId()
  const points = useMemo(() => costByMonth(resources, months, now), [resources, months, now])
  return <section className="panel trend-panel" aria-labelledby="cost-trend-title">
    <div className="panel-heading">
      <div><h2 id="cost-trend-title">Monthly cost trend</h2><p>Estimated run rate by month</p></div>
      <span className="chart-key"><i /> Monthly cost</span>
    </div>
    <div className="area-chart" aria-label="Estimated monthly cost area chart">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart data={points} margin={{ top: 14, right: 16, bottom: 0, left: 0 }}>
          <defs><linearGradient id={gradient} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#df6036" stopOpacity={0.23} /><stop offset="100%" stopColor="#df6036" stopOpacity={0.025} /></linearGradient></defs>
          <CartesianGrid vertical={false} stroke="#ede9e0" strokeDasharray="4 4" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={12} tick={{ fill: '#77766d', fontSize: 11 }} minTickGap={15} />
          <YAxis width={48} tickLine={false} axisLine={false} tickMargin={8} tick={{ fill: '#77766d', fontSize: 11 }} tickFormatter={value => axisMoney.format(value)} domain={[min => Math.min(min, 0), 'auto']} tickCount={5} />
          <Tooltip formatter={value => [money.format(Number(value)), 'Estimated run rate']} contentStyle={{ border: '1px solid #e7e3d9', borderRadius: 10 }} />
          <Area dataKey="cost" type="monotone" stroke="#d9592e" strokeWidth={2.5} fill={`url(#${gradient})`} dot={points.length <= 6 ? { r: 3, fill: '#d9592e', stroke: '#fffefa', strokeWidth: 1.25 } : false} activeDot={{ r: 5 }} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
    <p className="chart-note"><CircleHelp size={14} /> Uses current costs and known creation dates. Historical invoices may differ.</p>
  </section>
}

function ServiceCostChart({ resources }: { resources: Resource[] }) {
  const points = useMemo(() => {
    const totals = new Map<string, number>()
    for (const resource of resources) {
      const service = textValue(resource.service_name)
      totals.set(service, (totals.get(service) ?? 0) + amount(resource))
    }
    return [...totals].map(([service, cost]) => ({ service, cost }))
      .sort((a, b) => Math.abs(b.cost) - Math.abs(a.cost)).slice(0, 6)
  }, [resources])
  return <section className="panel trend-panel" aria-labelledby="service-cost-title">
    <div className="panel-heading">
      <div><h2 id="service-cost-title">Monthly cost by service</h2><p>Current cost across your cloud services</p></div>
      <span className="chart-key"><i /> Monthly cost</span>
    </div>
    <div className="area-chart" aria-label="Monthly cost by service bar chart">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={points} layout="vertical" margin={{ top: 10, right: 22, bottom: 0, left: 6 }}>
          <CartesianGrid horizontal={false} stroke="#ede9e0" strokeDasharray="4 4" />
          <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={value => axisMoney.format(value)} tick={{ fill: '#77766d', fontSize: 11 }} domain={[min => Math.min(min, 0), max => Math.max(max, 0)]} />
          <YAxis type="category" dataKey="service" width={90} tickLine={false} axisLine={false} tickMargin={8} tick={{ fill: '#77766d', fontSize: 11 }} tickFormatter={value => value.length > 13 ? `${value.slice(0, 12)}…` : value} />
          <Tooltip formatter={value => [money.format(Number(value)), 'Monthly cost']} contentStyle={{ border: '1px solid #e7e3d9', borderRadius: 10 }} />
          <Bar dataKey="cost" fill="#d9592e" radius={4} maxBarSize={24} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
    <p className="chart-note"><CircleHelp size={14} /> Showing up to six services by cost. A trend appears when creation dates are available.</p>
  </section>
}

function BreakdownChart({ resources }: { resources: Resource[] }) {
  const slices = useMemo(() => {
    const totals = new Map<string, number>()
    resources.forEach(resource => {
      const name = textValue(resource.resource_type)
      totals.set(name, (totals.get(name) ?? 0) + amount(resource))
    })
    const positive = [...totals].map(([name, value]) => ({ name, value }))
      .filter(slice => slice.value > 0).sort((left, right) => right.value - left.value)
    const displayed = positive.slice(0, colors.length)
    if (positive.length > colors.length) {
      displayed.splice(colors.length - 1, 1, {
        name: 'Other types',
        value: positive.slice(colors.length - 1).reduce((sum, slice) => sum + slice.value, 0),
      })
    }
    return displayed
  }, [resources])
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)
  const hasCredits = resources.some(resource => amount(resource) < 0)
  return <section className="panel breakdown-panel" aria-labelledby="cost-breakdown-title">
    <div className="panel-heading"><div><h2 id="cost-breakdown-title">Spend by type</h2><p>Monthly cost by resource type</p></div></div>
    {total > 0 ? <>
      <div className="donut-chart" aria-label="Monthly spend donut chart">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart>
            <Pie data={slices} dataKey="value" nameKey="name" innerRadius="73%" outerRadius="97%" startAngle={90} endAngle={-270} paddingAngle={slices.length > 1 ? 3 : 0} stroke="none" isAnimationActive={false}>
              {slices.map((slice, index) => <Cell key={slice.name} fill={colors[index]} />)}
            </Pie>
            <Tooltip formatter={value => money.format(Number(value))} contentStyle={{ border: '1px solid #e7e3d9', borderRadius: 10 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-label"><strong>{money.format(total).replace(/\.00$/, '')}</strong><span>{hasCredits ? 'Positive type totals' : 'Monthly spend'}</span></div>
      </div>
      <ul className="chart-legend">
        {slices.map((slice, index) => <li key={slice.name} title={money.format(slice.value)}>
          <i style={{ backgroundColor: colors[index] }} /><span>{slice.name}</span><strong>{pct.format(slice.value / total)}</strong>
        </li>)}
      </ul>
    </> : <ChartEmpty>There is no positive spend to display.</ChartEmpty>}
  </section>
}

function ChartEmpty({ children }: { children: string }) {
  return <div className="chart-empty"><ChartNoAxesCombined size={22} /><p>{children}</p></div>
}
