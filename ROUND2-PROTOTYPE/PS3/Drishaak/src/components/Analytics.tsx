import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  AreaChart, Area, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Reveal, SectionTitle, Counter } from "./ui";
import { violationsByType, reviewTrend, confidenceSplit } from "../data/mockApi";

const KPIS = [
  { label: "Cases processed / day", value: 1240, suffix: "" },
  { label: "Auto-cleared", value: 58, suffix: "%" },
  { label: "False-challan rate", value: 2, prefix: "<", suffix: "%" },
  { label: "Officer time saved", value: 70, suffix: "%" },
];

const tooltipStyle = {
  background: "#11141C", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12, color: "#fff", fontSize: 12,
};

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl glass p-5">
      <h3 className="mb-4 text-sm font-bold text-white">{title}</h3>
      {children}
    </div>
  );
}

export default function Analytics() {
  return (
    <section id="analytics" className="relative py-24 sm:py-32 grid-bg">
      <div className="section-pad">
        <SectionTitle
          kicker="Command dashboard"
          title={<>From frames to <span className="text-gradient">decisions</span></>}
          sub="The analytics layer turns the violation stream into the operational picture BTP runs on — hotspots, trends, reviewer load and the false-challan rate."
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => (
            <Reveal key={k.label} delay={i * 0.06}>
              <div className="rounded-2xl glass p-5">
                <div className="text-3xl font-extrabold text-white">
                  <Counter value={k.value} prefix={k.prefix} suffix={k.suffix} />
                </div>
                <div className="mt-1 text-xs text-slate-400">{k.label}</div>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <Reveal>
            <Card title="Violations by type (7-day)">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={violationsByType} margin={{ left: -18 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="type" tick={{ fill: "#94a3b8", fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#FFC200" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Reveal>

          <Reveal delay={0.08}>
            <Card title="Auto-detected vs human-reviewed">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={reviewTrend} margin={{ left: -18 }}>
                  <defs>
                    <linearGradient id="a1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#22D3EE" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="a2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FFC200" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#FFC200" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="day" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="auto" stroke="#22D3EE" fill="url(#a1)" strokeWidth={2} />
                  <Area type="monotone" dataKey="reviewed" stroke="#FFC200" fill="url(#a2)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </Reveal>

          <Reveal delay={0.16}>
            <Card title="Confidence routing">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={confidenceSplit} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                    {confidenceSplit.map((e) => <Cell key={e.name} fill={e.fill} stroke="none" />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
