import { createFileRoute } from "@tanstack/react-router";
import { MoreHorizontal, Percent, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_dashboard/")({
  component: OverviewPage,
});

const attendanceSegments = [
  { label: "Present", value: 78, color: "#0f9f7f" },
  { label: "Leave", value: 14, color: "#e74c3c" },
  { label: "Late", value: 8, color: "#f4c542" },
] as const;

const pendingRequests = [
  { title: "Recent Request", time: "Last 3 hours ago" },
  { title: "Pending Request", time: "Last 3 hours ago" },
  { title: "Pending Request", time: "Last 3 hours ago" },
] as const;

type MovementDatum = {
  day: string;
  primary: number;
  secondary: number;
};

const spentInChartData: MovementDatum[] = [
  { day: "Mon", primary: 585, secondary: 575 },
  { day: "Tue", primary: 600, secondary: 590 },
  { day: "Wed", primary: 590, secondary: 585 },
  { day: "Thu", primary: 610, secondary: 600 },
  { day: "Fri", primary: 595, secondary: 602 },
  { day: "Sat", primary: 620, secondary: 610 },
  { day: "Sun", primary: 630, secondary: 618 },
];

const spentOutChartData: MovementDatum[] = [
  { day: "Mon", primary: 1080, secondary: 1060 },
  { day: "Tue", primary: 1050, secondary: 1035 },
  { day: "Wed", primary: 1020, secondary: 1010 },
  { day: "Thu", primary: 1090, secondary: 1055 },
  { day: "Fri", primary: 1040, secondary: 1030 },
  { day: "Sat", primary: 980, secondary: 995 },
  { day: "Sun", primary: 930, secondary: 960 },
];

const yAxisTimeTicks = [
  { label: "06:30 PM", value: 1110 },
  { label: "04:30 PM", value: 990 },
  { label: "03:00 PM", value: 900 },
  { label: "01:00 PM", value: 780 },
  { label: "11:30 AM", value: 690 },
  { label: "09:30 AM", value: 570 },
] as const;

const softCardClass =
  "rounded-[22px] border border-slate-200 bg-white text-foreground";

const glowAmberClass =
  "rounded-[22px] border border-slate-200 bg-white text-foreground";

const glowEmeraldClass =
  "rounded-[22px] border border-slate-200 bg-white text-foreground";

const movementChartCardClass =
  "rounded-[22px] border border-slate-200 bg-white text-foreground";

const CHART_WIDTH = 940;
const CHART_HEIGHT = 220;
const CHART_PADDING_X = 36;
const CHART_PADDING_TOP = 12;
const CHART_PADDING_BOTTOM = 26;

type MovementChartPanelProps = {
  title: string;
  primaryLabel: string;
  secondaryLabel: string;
  data: MovementDatum[];
  idPrefix: string;
  showPrimary?: boolean;
};

function MovementChartPanel({ title, primaryLabel, secondaryLabel, data, idPrefix, showPrimary = true }: MovementChartPanelProps) {
  const maxValue = yAxisTimeTicks[0].value;
  const minValue = yAxisTimeTicks[yAxisTimeTicks.length - 1].value;
  const plotWidth = CHART_WIDTH - CHART_PADDING_X * 2;
  const plotHeight = CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM;
  const valueRange = Math.max(maxValue - minValue, 1);
  const primaryColor = "#67b7ff";
  const secondaryColor = "#8b5cf6";
  const groupWidth = plotWidth / Math.max(data.length, 1);
  const singleBarWidth = Math.min(22, groupWidth * 0.55);
  const groupedBarWidth = Math.min(14, groupWidth * 0.32);
  const groupedGap = 4;
  const chartBottomY = CHART_PADDING_TOP + plotHeight;
  const toY = (value: number) => CHART_PADDING_TOP + ((maxValue - value) / valueRange) * plotHeight;

  return (
    <div className="p-3 md:p-3.5">
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-medium tracking-tight text-slate-800">{title}</h3>
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <span className="flex items-center gap-2">
            <Dot color={secondaryColor} />
            {secondaryLabel}
          </span>
          {showPrimary ? (
            <span className="flex items-center gap-2">
              <Dot color={primaryColor} />
              {primaryLabel}
            </span>
          ) : null}
        </div>
      </div>

      <div className="h-[190px] w-full">
        <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="h-full w-full" role="img" aria-label={`${title} bar chart`}>
          {yAxisTimeTicks.map((tick) => {
            const y = toY(tick.value);
            return (
              <g key={`${idPrefix}-${tick.label}`}>
                <line
                  x1={CHART_PADDING_X}
                  y1={y}
                  x2={CHART_WIDTH - CHART_PADDING_X}
                  y2={y}
                  stroke="rgba(148,163,184,0.35)"
                  strokeWidth={1}
                />
                <text x={7} y={y + 3} fontSize={10} fill="rgba(71,85,105,0.85)">
                  {tick.label}
                </text>
              </g>
            );
          })}

          {data.map((item, index) => {
            const groupLeft = CHART_PADDING_X + index * groupWidth;
            const groupCenter = groupLeft + groupWidth / 2;
            const secondaryY = toY(item.secondary);
            const secondaryHeight = Math.max(chartBottomY - secondaryY, 2);
            const secondaryX = showPrimary ? groupCenter + groupedGap / 2 : groupCenter - singleBarWidth / 2;
            const secondaryWidth = showPrimary ? groupedBarWidth : singleBarWidth;

            return (
              <g key={`${idPrefix}-bar-${item.day}`}>
                {showPrimary ? (
                  <rect
                    x={groupCenter - groupedBarWidth - groupedGap / 2}
                    y={toY(item.primary)}
                    width={groupedBarWidth}
                    height={Math.max(chartBottomY - toY(item.primary), 2)}
                    rx={4}
                    fill={primaryColor}
                    opacity={0.9}
                  />
                ) : null}
                <rect
                  x={secondaryX}
                  y={secondaryY}
                  width={secondaryWidth}
                  height={secondaryHeight}
                  rx={4}
                  fill={secondaryColor}
                />
              </g>
            );
          })}

          {data.map((item, index) => {
            const x = CHART_PADDING_X + index * groupWidth + groupWidth / 2;
            return (
              <text
                key={`${idPrefix}-${item.day}`}
                x={x}
                y={CHART_HEIGHT - 8}
                textAnchor="middle"
                fontSize={12}
                fill="rgba(71,85,105,0.88)"
              >
                {item.day}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function EmployeeMovementChart() {
  const maxValue = yAxisTimeTicks[0].value;
  const minValue = yAxisTimeTicks[yAxisTimeTicks.length - 1].value;
  if (!maxValue && !minValue) return null;

  return (
    <div className="grid h-full grid-cols-1 gap-2 lg:grid-cols-2">
      <Card className={movementChartCardClass}>
        <CardContent className="h-full p-0">
          <MovementChartPanel
            title="Employees Spent In"
            primaryLabel="Spent In"
            secondaryLabel="Average In"
            data={spentInChartData}
            idPrefix="spent-in"
            showPrimary={false}
          />
        </CardContent>
      </Card>
      <Card className={movementChartCardClass}>
        <CardContent className="h-full p-0">
          <MovementChartPanel
            title="Employees Spent Out"
            primaryLabel="Spent Out"
            secondaryLabel="Average Out"
            data={spentOutChartData}
            idPrefix="spent-out"
            showPrimary={false}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function AttendanceRing() {
  const size = 160;
  const center = size / 2;
  const outerRadius = 62;
  const middleRadius = 48;
  const innerRadius = 34;
  const outerCircumference = 2 * Math.PI * outerRadius;
  const middleCircumference = 2 * Math.PI * middleRadius;
  const innerCircumference = 2 * Math.PI * innerRadius;
  const presentProgress = 0.9;
  const leaveProgress = 0.78;
  const lateProgress = 0.66;
  const ringStroke = 8;

  return (
    <div className="relative grid h-[160px] w-[160px] place-items-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full">
        <circle
          cx={center}
          cy={center}
          r={outerRadius}
          fill="none"
          stroke="rgba(148,163,184,0.35)"
          strokeWidth={ringStroke}
        />
        <circle
          cx={center}
          cy={center}
          r={middleRadius}
          fill="none"
          stroke="rgba(148,163,184,0.28)"
          strokeWidth={ringStroke}
        />
        <circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill="none"
          stroke="rgba(148,163,184,0.24)"
          strokeWidth={ringStroke}
        />

        <circle
          cx={center}
          cy={center}
          r={outerRadius}
          fill="none"
          stroke="#0f9f7f"
          strokeWidth={ringStroke}
          strokeLinecap="round"
          strokeDasharray={`${outerCircumference * presentProgress} ${outerCircumference}`}
          strokeDashoffset={outerCircumference * 0.17}
          transform={`rotate(-90 ${center} ${center})`}
        />
        <circle
          cx={center}
          cy={center}
          r={middleRadius}
          fill="none"
          stroke="#e74c3c"
          strokeWidth={ringStroke}
          strokeLinecap="round"
          strokeDasharray={`${middleCircumference * leaveProgress} ${middleCircumference}`}
          strokeDashoffset={middleCircumference * 0.22}
          transform={`rotate(-90 ${center} ${center})`}
        />
        <circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill="none"
          stroke="#f4c542"
          strokeWidth={ringStroke}
          strokeLinecap="round"
          strokeDasharray={`${innerCircumference * lateProgress} ${innerCircumference}`}
          strokeDashoffset={innerCircumference * 0.14}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>

      <div className="absolute inset-[32%] grid place-items-center rounded-full bg-white">
        <svg viewBox="0 0 120 120" className="h-11 w-11" aria-hidden="true">
          <defs>
            <linearGradient id="cursor-beam" x1="0.5" y1="0.18" x2="0.5" y2="1">
              <stop offset="0%" stopColor="rgba(30,58,138,0.42)" />
              <stop offset="100%" stopColor="rgba(30,58,138,0)" />
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(148,163,184,0.34)" strokeWidth={5} />
          <circle
            cx="60"
            cy="60"
            r="36"
            fill="none"
            stroke="rgba(148,163,184,0.26)"
            strokeWidth={3}
            strokeDasharray="5 5"
          />
          <g className="attendance-cursor-float">
            <path d="M60 42 L40 80 L80 80 Z" fill="url(#cursor-beam)" />
            <path
              d="M60 26 L74 52 L63.5 49.4 L60 59 L56.5 49.4 L46 52 Z"
              fill="#ffffff"
              stroke="#0f172a"
              strokeWidth={1.6}
              strokeLinejoin="round"
            />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />;
}

function OverviewPage() {
  return (
    <div className="h-full overflow-hidden">
      <section className="mx-auto flex h-full max-w-6xl flex-col gap-2">
        <div className="grid flex-none grid-cols-1 gap-2 xl:grid-cols-[0.95fr_1.05fr_1.15fr]">
          <div className="grid gap-2">
            <Card className={softCardClass}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-0">
                <CardTitle className="text-base font-medium tracking-tight text-slate-800">Total Employees</CardTitle>
                <MoreHorizontal className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent className="flex items-center justify-between pt-0">
                <div>
                  <p className="text-3xl font-bold tracking-tight text-slate-900">2,450</p>
                  <p className="mt-0.5 text-xs font-semibold text-[#0b936f]">+2.45%</p>
                </div>
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100">
                  <Users className="h-4 w-4 text-slate-600" />
                </div>
              </CardContent>
            </Card>

            <Card className={glowEmeraldClass}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-0">
                <CardTitle className="text-base font-medium tracking-tight text-slate-800">Present Today</CardTitle>
                <MoreHorizontal className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent className="flex items-center justify-between pt-0">
                <div>
                  <p className="text-3xl font-bold tracking-tight text-slate-900">2,397</p>
                </div>
                <div className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-slate-50">
                  <Percent className="h-4 w-4 text-slate-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className={glowAmberClass}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium tracking-tight text-slate-800">Attendance Stats</CardTitle>
              <MoreHorizontal className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-col items-center gap-2 md:flex-row md:items-start md:justify-between">
                <AttendanceRing />
                <div className="space-y-1.5 pt-0.5 md:pt-1.5">
                  {attendanceSegments.map((item) => (
                    <div key={item.label} className="flex items-center gap-2 text-xs font-medium text-slate-700">
                      <Dot color={item.color} />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={softCardClass}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-1.5">
              <CardTitle className="text-base font-medium tracking-tight text-slate-800">Pending Requests</CardTitle>
              <MoreHorizontal className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-3xl font-bold leading-none text-slate-900">3</p>

              <div className="space-y-1.5">
                {pendingRequests.map((request, index) => (
                  <div
                    key={`${request.title}-${index}`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{request.title}</p>
                      <p className="text-[11px] text-slate-500">{request.time}</p>
                    </div>
                    <span className="rounded-full bg-[#10926f] px-2 py-0.5 text-[11px] font-semibold text-white">
                      Status
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="min-h-0 flex-1">
          <EmployeeMovementChart />
        </div>
      </section>
    </div>
  );
}

