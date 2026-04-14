import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { Calendar, Filter, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { mockPresenceHistory, type PresenceRecord } from "@/data/mockPresence";
import { mockHolidayCalendar } from "@/data/mockHolidayCalendar";
import { mockEmployees } from "@/data/mockEmployees";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dashboard/presence")({
  component: PresencePage,
});

type CalendarCellStatus = "Present" | "Late" | "Absent" | "Holiday" | null;

const calendarDayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const calendarStatusStyles: Record<Exclude<CalendarCellStatus, null>, {
  code: "P" | "L" | "A" | "H";
  label: string;
  cellClassName: string;
  bubbleClassName: string;
}> = {
  Present: {
    code: "P",
    label: "Present",
    cellClassName: "border-emerald-200 bg-emerald-50/80",
    bubbleClassName: "border-emerald-300 bg-emerald-100 text-emerald-700",
  },
  Late: {
    code: "L",
    label: "Late",
    cellClassName: "border-amber-200 bg-amber-50/85",
    bubbleClassName: "border-amber-300 bg-amber-100 text-amber-700",
  },
  Absent: {
    code: "A",
    label: "Absent",
    cellClassName: "border-rose-200 bg-rose-50/85",
    bubbleClassName: "border-rose-300 bg-rose-100 text-rose-700",
  },
  Holiday: {
    code: "H",
    label: "Holiday",
    cellClassName: "border-violet-200 bg-violet-50/85",
    bubbleClassName: "border-violet-300 bg-violet-100 text-violet-700",
  },
};

function formatDateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function toCalendarStatus(status: PresenceRecord["status"]): Exclude<CalendarCellStatus, null> {
  if (status === "Absent") {
    return "Absent";
  }
  if (status === "Late" || status === "Early Exit") {
    return "Late";
  }
  return "Present";
}

function summarizeDailyStatus(statuses: PresenceRecord["status"][]): Exclude<CalendarCellStatus, null> {
  const normalizedStatuses = statuses.map(toCalendarStatus);

  if (normalizedStatuses.includes("Absent")) {
    return "Absent";
  }
  if (normalizedStatuses.includes("Late")) {
    return "Late";
  }
  return "Present";
}

function csvEscape(value: string | number | null | undefined) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
}

function formatCalendarTime(time: string | null | undefined) {
  const raw = String(time ?? "").trim();
  if (!raw || raw === "-" || raw === "—" || raw === "â€”") {
    return "--";
  }

  const match = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return raw;
  }

  const hours24 = Number(match[1]);
  const minutes = match[2];
  const suffix = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${String(hours12).padStart(2, "0")}.${minutes} ${suffix}`;
}

function PresencePage() {
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("none");
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date("2026-01-01"));
  const [selectedDate, setSelectedDate] = useState<string>("");

  const companyOptions = useMemo(
    () => Array.from(new Set(mockEmployees.map((employee) => employee.company))),
    []
  );

  const employeesForSelectedCompany = useMemo(
    () => (selectedCompany === "all"
      ? mockEmployees
      : mockEmployees.filter((employee) => employee.company === selectedCompany)),
    [selectedCompany]
  );

  useEffect(() => {
    if (selectedEmployee === "none") {
      return;
    }

    const existsInCompanyList = employeesForSelectedCompany.some((employee) => employee.employeeId === selectedEmployee);
    if (!existsInCompanyList) {
      setSelectedEmployee("none");
    }
  }, [employeesForSelectedCompany, selectedEmployee]);

  const historyRecords = useMemo(() => {
    if (selectedEmployee === "none") {
      return [];
    }
    const records = mockPresenceHistory.filter((r) => r.employeeId === selectedEmployee);
    return [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedEmployee]);

  const dailyStatusMap = useMemo(() => {
    const groupedByDate = new Map<string, PresenceRecord["status"][]>();

    historyRecords.forEach((record) => {
      const statuses = groupedByDate.get(record.date) ?? [];
      statuses.push(record.status);
      groupedByDate.set(record.date, statuses);
    });

    const dailyMap = new Map<string, Exclude<CalendarCellStatus, null>>();
    groupedByDate.forEach((statuses, date) => {
      dailyMap.set(date, summarizeDailyStatus(statuses));
    });

    return dailyMap;
  }, [historyRecords]);

  const dailyRecordCountMap = useMemo(() => {
    const dailyCountMap = new Map<string, number>();
    historyRecords.forEach((record) => {
      dailyCountMap.set(record.date, (dailyCountMap.get(record.date) ?? 0) + 1);
    });
    return dailyCountMap;
  }, [historyRecords]);

  const recordByDateMap = useMemo(() => {
    const map = new Map<string, PresenceRecord>();
    historyRecords.forEach((record) => {
      if (!map.has(record.date)) {
        map.set(record.date, record);
      }
    });
    return map;
  }, [historyRecords]);

  const holidayNameByDate = useMemo(() => {
    const holidayMap = new Map<string, string>();
    mockHolidayCalendar.forEach((holiday) => {
      holidayMap.set(holiday.date, holiday.name);
    });
    return holidayMap;
  }, []);

  const calendarCells = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const monthStart = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstWeekday = monthStart.getDay();
    const previousMonthDays = new Date(year, month, 0).getDate();

    const cells: {
      dateKey: string;
      dayNumber: number;
      inCurrentMonth: boolean;
      status: CalendarCellStatus;
      holidayName: string | null;
    }[] = [];

    for (let offset = firstWeekday - 1; offset >= 0; offset -= 1) {
      const dayNumber = previousMonthDays - offset;
      const date = new Date(year, month - 1, dayNumber);
      cells.push({
        dateKey: formatDateKey(date),
        dayNumber,
        inCurrentMonth: false,
        status: null,
        holidayName: null,
      });
    }

    for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber += 1) {
      const date = new Date(year, month, dayNumber);
      const dateKey = formatDateKey(date);
      let status: CalendarCellStatus = dailyStatusMap.get(dateKey) ?? null;
      const holidayName = holidayNameByDate.get(dateKey) ?? null;

      if (!status && holidayName) {
        status = "Holiday";
      }

      cells.push({
        dateKey,
        dayNumber,
        inCurrentMonth: true,
        status,
        holidayName,
      });
    }

    const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
    const trailingCells = totalCells - cells.length;
    for (let dayNumber = 1; dayNumber <= trailingCells; dayNumber += 1) {
      const date = new Date(year, month + 1, dayNumber);
      cells.push({
        dateKey: formatDateKey(date),
        dayNumber,
        inCurrentMonth: false,
        status: null,
        holidayName: null,
      });
    }

    return cells;
  }, [calendarMonth, dailyStatusMap, holidayNameByDate]);

  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(calendarMonth),
    [calendarMonth]
  );

  const selectedEmployeeLabel =
    selectedEmployee === "none"
      ? "Employee not selected"
      : mockEmployees.find((emp) => emp.employeeId === selectedEmployee)?.name ?? "Selected Employee";

  const monthRecordCount = useMemo(
    () =>
      historyRecords.filter((record) => {
        const recordDate = new Date(record.date);
        return (
          recordDate.getFullYear() === calendarMonth.getFullYear()
          && recordDate.getMonth() === calendarMonth.getMonth()
        );
      }).length,
    [historyRecords, calendarMonth]
  );

  const hasSelectedEmployee = selectedEmployee !== "none";

  const monthlySummary = useMemo(() => {
    const summary = { present: 0, late: 0, absent: 0, holiday: 0 };
    calendarCells.forEach((cell) => {
      if (!cell.inCurrentMonth || !cell.status) {
        return;
      }

      if (cell.status === "Present") summary.present += 1;
      if (cell.status === "Late") summary.late += 1;
      if (cell.status === "Absent") summary.absent += 1;
      if (cell.status === "Holiday") summary.holiday += 1;
    });
    return summary;
  }, [calendarCells]);

  const handleExportReport = () => {
    if (!hasSelectedEmployee) {
      return;
    }

    const currentMonthCells = calendarCells.filter((cell) => cell.inCurrentMonth);
    const selectedEmployeeName =
      mockEmployees.find((emp) => emp.employeeId === selectedEmployee)?.name ?? "Selected Employee";

    const headers = [
      "Date",
      "Day",
      "Employee",
      "Status",
      "Holiday",
      "Attendance Entries",
      "Entry Time",
      "Exit Time",
      "Total Hours",
    ];

    const rows = currentMonthCells.map((cell) => {
      const date = new Date(cell.dateKey);
      const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
      const record = recordByDateMap.get(cell.dateKey);

      return [
        cell.dateKey,
        weekday,
        selectedEmployeeName,
        cell.status ?? "",
        cell.holidayName ?? "",
        dailyRecordCountMap.get(cell.dateKey) ?? 0,
        record?.entryTime ?? "",
        record?.exitTime ?? "",
        record?.totalHours ?? "",
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map((value) => csvEscape(value)).join(","))
      .join("\n");

    const monthTag = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, "0")}`;
    const employeeTag = selectedEmployee.toLowerCase();
    const fileName = `attendance-report-${employeeTag}-${monthTag}.csv`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Attendance History" icon={<Calendar className="h-5 w-5 text-primary" />} />

      {/* Employee history section */}
      <Card className={cn("animate-fade-in-up", !hasSelectedEmployee && "min-h-[420px]")}>
        <CardContent className="space-y-3">
          {/* Filters */}
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <Filter className="h-4 w-4 text-muted-foreground" />

              <div className="flex items-center gap-2">
                <span className="whitespace-nowrap text-sm font-medium leading-none text-slate-600">Employees:</span>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger className="h-10 w-[260px]">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select Employee</SelectItem>
                    {employeesForSelectedCompany.map((emp) => (
                      <SelectItem key={emp.employeeId} value={emp.employeeId}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="whitespace-nowrap text-sm font-medium leading-none text-slate-600">Companies:</span>
                <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                  <SelectTrigger className="h-10 w-[240px]">
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Companies</SelectItem>
                    {companyOptions.map((company) => (
                      <SelectItem key={company} value={company}>
                        {company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="whitespace-nowrap text-sm font-medium leading-none text-slate-600">Choose Date:</span>
                <Input
                  type="date"
                  className="h-10 w-[220px]"
                  value={selectedDate}
                  onChange={(e) => {
                    const nextDate = e.target.value;
                    setSelectedDate(nextDate);
                    if (nextDate) {
                      const [year, month] = nextDate.split("-").map(Number);
                      setCalendarMonth(new Date(year, month - 1, 1));
                    }
                  }}
                />
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              className="h-10 shrink-0 gap-1.5 px-4 self-start xl:self-auto"
              onClick={handleExportReport}
              disabled={!hasSelectedEmployee}
            >
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>

          {!hasSelectedEmployee ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-5 text-center">
              <p className="text-sm font-medium text-slate-700">Attendance calendar is hidden by default.</p>
              <p className="mt-1 text-sm text-slate-500">
                Choose an employee to view the attendance calendar and detailed report.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100/70 p-2.5 shadow-sm">
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-3xl font-semibold leading-none tracking-tight text-slate-900">{monthLabel}</h3>
                    <p className="mt-1 text-xs text-slate-500">{selectedEmployeeLabel}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-white"
                      onClick={() => {
                        setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
                      }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="px-1 text-sm font-medium text-slate-600">Month View</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-white"
                      onClick={() => {
                        setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
                      }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mb-1.5 grid grid-cols-2 gap-1 md:grid-cols-4">
                  <div className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-800">
                    Present: {monthlySummary.present}
                  </div>
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800">
                    Late: {monthlySummary.late}
                  </div>
                  <div className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-800">
                    Absent: {monthlySummary.absent}
                  </div>
                  <div className="rounded-md border border-violet-200 bg-violet-50 px-2 py-1 text-xs text-violet-800">
                    Holiday: {monthlySummary.holiday}
                  </div>
                </div>

                <div>
                  <div className="mb-1 grid grid-cols-7 gap-1.5">
                    {calendarDayLabels.map((day) => (
                      <div key={day} className="px-1 text-center text-xs font-medium text-slate-600">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1.5">
                    {calendarCells.map((cell) => {
                      const statusStyle = cell.status ? calendarStatusStyles[cell.status] : null;
                      const dayRecord = recordByDateMap.get(cell.dateKey);
                      const showTimeStrip = cell.inCurrentMonth && !!statusStyle && cell.status !== "Holiday";

                      return (
                        <div
                          key={cell.dateKey}
                          title={cell.holidayName ?? undefined}
                          className={cn(
                            "relative h-[84px] rounded-xl border p-2 transition-colors",
                            cell.inCurrentMonth ? "border-slate-200 bg-white/90" : "border-slate-200 bg-slate-50/90 opacity-60",
                            statusStyle?.cellClassName,
                            cell.dateKey === selectedDate ? "border-primary/50 ring-2 ring-primary/25" : ""
                          )}
                        >
                          <span
                            className={cn(
                              "text-xs font-semibold",
                              cell.inCurrentMonth ? "text-slate-600" : "text-slate-400"
                            )}
                          >
                            {cell.dayNumber}
                          </span>

                          {statusStyle && (
                            <div className="absolute inset-x-0 top-[42%] flex -translate-y-1/2 justify-center">
                              <span
                                className={cn(
                                  "inline-flex h-9 w-9 items-center justify-center rounded-full border text-base font-semibold shadow-sm",
                                  statusStyle.bubbleClassName
                                )}
                              >
                                {statusStyle.code}
                              </span>
                            </div>
                          )}

                          {showTimeStrip && (
                            <div className="absolute inset-x-2 bottom-1.5 flex items-center justify-between text-[10px] font-medium text-slate-700">
                              <span>{formatCalendarTime(dayRecord?.entryTime)}</span>
                              <span className="text-sm font-semibold leading-none text-slate-900">-</span>
                              <span>{formatCalendarTime(dayRecord?.exitTime ?? null)}</span>
                            </div>
                          )}

                          {cell.inCurrentMonth && cell.status === "Holiday" && (
                            <div className="absolute inset-x-1.5 bottom-1.5 text-center text-[10px] font-medium text-violet-700">
                              {cell.holidayName ?? "Holiday"}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-1.5 text-right text-[11px] text-slate-500">{monthRecordCount} attendance records</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

