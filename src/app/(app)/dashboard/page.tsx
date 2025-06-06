"use client";

import * as React from "react";
import {
  useGenerateFairGreedyScheduleMutation,
  useGenerateBasicGreedyScheduleMutation,
  useGenerateRoundRobinScheduleMutation,
  useGetAllSchedulesQuery,
  useCompareSchedulesQuery,
} from "@/api/schedule";
import { useGetAllEmployeesQuery } from "@/api/user";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DatePickerWithRange } from "@/components/common/schedule/DatePicker";
import { DateRange as PickerDateRange } from "react-day-picker";
import {
  format,
  startOfDay,
  parseISO,
  startOfWeek,
  addDays,
} from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Loader2, RefreshCcw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const COLORS = ["#36A2EB", "#FF6384", "#4BC0C0"];
const TIMEZONE = "Africa/Lagos";

interface DateRange {
  from: string;
  to: string;
  weekStart: string;
}

export default function Dashboard() {
  const queryClient = useQueryClient();

  // State for date range
  const [dateRange, setDateRange] = React.useState<PickerDateRange | undefined>(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("dateRange") : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.from && parsed.to) {
          return {
            from: new Date(parsed.from),
            to: new Date(parsed.to),
          };
        }
      }
    } catch (error) {
      console.error("Failed to parse dateRange from localStorage:", error);
    }
    const today = toZonedTime(new Date(), TIMEZONE);
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    return {
      from: weekStart,
      to: addDays(weekStart, 4),
    };
  });

  // Save date range to localStorage
  React.useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      try {
        localStorage.setItem(
          "dateRange",
          JSON.stringify({
            from: dateRange.from.toISOString(),
            to: dateRange.to.toISOString(),
          })
        );
      } catch (error) {
        console.error("Failed to save dateRange:", error);
      }
    }
  }, [dateRange]);

  // Compute API date range
  const apiDateRange = React.useMemo((): DateRange | null => {
    if (!dateRange?.from) return null;
    const weekStartZoned = startOfWeek(toZonedTime(dateRange.from, TIMEZONE), { weekStartsOn: 1 });
    const weekEndZoned = addDays(weekStartZoned, 4);
    return {
      from: format(fromZonedTime(weekStartZoned, TIMEZONE), "yyyy-MM-dd"),
      to: format(fromZonedTime(weekEndZoned, TIMEZONE), "yyyy-MM-dd"),
      weekStart: format(fromZonedTime(weekStartZoned, TIMEZONE), "yyyy-MM-dd"),
    };
  }, [dateRange]);

  // Fetch data
  const { data: employees = [], isLoading: employeesLoading } = useGetAllEmployeesQuery();
  const { data: schedules = [], isLoading: schedulesLoading } = useGetAllSchedulesQuery(
    apiDateRange?.weekStart ?? ""
  );
  const { data: comparisonData, isPending: comparisonLoading, refetch: refetchComparison } = useCompareSchedulesQuery(apiDateRange);
  const fairGreedyMutation = useGenerateFairGreedyScheduleMutation();
  const basicGreedyMutation = useGenerateBasicGreedyScheduleMutation();
  const roundRobinMutation = useGenerateRoundRobinScheduleMutation();

  // Compute schedule metrics
  const scheduleMetrics = React.useMemo(() => {
    if (!employees.length || !schedules.length || !apiDateRange) return null;
    const weekStart = startOfWeek(toZonedTime(parseISO(apiDateRange.weekStart), TIMEZONE), { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 4);
    const weekSchedules = schedules.filter((s) => {
      const scheduleDate = toZonedTime(parseISO(s.workday.date), TIMEZONE);
      return scheduleDate >= weekStart && scheduleDate <= weekEnd && s.type === "FAIR";
    });
    const totalSchedules = weekSchedules.length;
    const avgSchedulesPerEmployee = employees.length ? (totalSchedules / employees.length).toFixed(1) : "0.0";
    type Weekday = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
    const dayCounts: Record<Weekday, number> = { Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0 };
    weekSchedules.forEach((s) => {
      const scheduleDate = startOfDay(toZonedTime(parseISO(s.workday.date), TIMEZONE));
      const day = format(scheduleDate, "EEEE") as Weekday;
      dayCounts[day]++;
    });
    const pieData = Object.entries(dayCounts).map(([name, value]) => ({ name, value }));
    return {
      totalEmployees: employees.length,
      totalSchedules,
      avgSchedulesPerEmployee,
      pieData,
    };
  }, [employees, schedules, apiDateRange]);

  // Compute fairness metrics
  const fairnessMetrics = React.useMemo(() => {
    if (!comparisonData || !apiDateRange) return null;
    const fairGreedy = comparisonData.fairGreedy;
    if (fairGreedy.outOfBounds.length) {
      toast.warning("Fairness Issue", {
        description: `Employees with fairness scores outside [-3, +3]: ${fairGreedy.outOfBounds.join(", ")}`,
      });
    }
    if (fairGreedy.invalidAssignments.length) {
      toast.warning("Assignment Issue", {
        description: `Employees with invalid assignments (not 2–3 days): ${fairGreedy.invalidAssignments.join(", ")}`,
      });
    }
    return {
      averageScore: fairGreedy.averageScore,
      fairnessIndex: fairGreedy.fairnessIndex,
      totalSchedules: fairGreedy.total,
      totalPenalty: fairGreedy.totalPenalty,
    };
  }, [comparisonData, apiDateRange]);

  // Comparison chart data
  const comparisonChartData = React.useMemo(() => {
    if (!comparisonData) return [];
    return [
      { name: "Fair Greedy", fairnessIndex: comparisonData.fairGreedy.fairnessIndex, averageScore: comparisonData.fairGreedy.averageScore, totalPenalty: comparisonData.fairGreedy.totalPenalty },
      { name: "Basic Greedy", fairnessIndex: comparisonData.basicGreedy.fairnessIndex, averageScore: comparisonData.basicGreedy.averageScore, totalPenalty: comparisonData.basicGreedy.totalPenalty },
      { name: "Round Robin", fairnessIndex: comparisonData.roundRobin.fairnessIndex, averageScore: comparisonData.roundRobin.averageScore, totalPenalty: comparisonData.roundRobin.totalPenalty },
    ];
  }, [comparisonData]);

  // Handle schedule generation
  const handleGenerate = (type: "fair" | "basic" | "roundRobin") => {
    if (!apiDateRange) return;
    const mutation = {
      fair: fairGreedyMutation,
      basic: basicGreedyMutation,
      roundRobin: roundRobinMutation,
    }[type];
    mutation.mutate(apiDateRange, {
      onSuccess: (data: unknown[]) => {
        queryClient.invalidateQueries({ queryKey: ["allSchedules", apiDateRange.weekStart] });
        queryClient.invalidateQueries({ queryKey: ["compareSchedules", apiDateRange.weekStart] });
        if (data.length === 0 || (Array.isArray(data) && data[0] === "yooo")) {
          toast.info("Week Already Scheduled", { description: `Schedules for ${apiDateRange.weekStart} exist.` });
        } else {
          toast.success("Schedule Generated", { description: `${type.charAt(0).toUpperCase() + type.slice(1)} schedule generated.` });
        }
      },
      onError: (error: unknown) => {
        let message = "Failed to generate schedule.";
        if (error && typeof error === "object" && "message" in error && typeof (error as { message?: unknown }).message === "string") {
          message = (error as { message: string }).message;
        }
        toast.error("Error", { description: message });
      },
    });
  };

  const isLoading = employeesLoading || schedulesLoading || comparisonLoading || fairGreedyMutation.isPending || basicGreedyMutation.isPending || roundRobinMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-[#395B64]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50 dark:bg-gray-900 p-6 gap-6 text-[#395B64]">
      {/* Sidebar */}
      <div className="lg:w-80 space-y-6">
        <Card className="bg-white dark:bg-gray-800 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-200">Control Center</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h2 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Date Range</h2>
              <DatePickerWithRange
                className="w-full bg-white dark:bg-gray-800"
                date={dateRange}
                onDateChange={setDateRange}
              />
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Schedule Actions</h2>
              <div className="grid grid-cols-1 gap-4">
                <Button
                  onClick={() => handleGenerate("fair")}
                  disabled={fairGreedyMutation.isPending || !apiDateRange}
                  className="bg-[#395B64] text-white hover:bg-[#2A4A52]"
                >
                  {fairGreedyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
                  Fair Greedy
                </Button>
                <Button
                  onClick={() => handleGenerate("basic")}
                  disabled={basicGreedyMutation.isPending || !apiDateRange}
                  className="bg-[#FF6384] text-white hover:bg-[#E5395A]"
                >
                  {basicGreedyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
                  Basic Greedy
                </Button>
                <Button
                  onClick={() => handleGenerate("roundRobin")}
                  disabled={roundRobinMutation.isPending || !apiDateRange}
                  className="bg-[#4BC0C0] text-white hover:bg-[#3A9A9A]"
                >
                  {roundRobinMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
                  Round Robin
                </Button>
                <Button
                  onClick={() => refetchComparison()}
                  disabled={comparisonLoading || !apiDateRange}
                  className="bg-[#36A2EB] text-white hover:bg-[#2A80B9]"
                >
                  {comparisonLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
                  Compare All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        <h1 className="text-3xl font-bold text-black dark:text-white">Scheduling Dashboard</h1>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: "Total Employees", value: scheduleMetrics?.totalEmployees || 0 },
            { title: "Total Schedules (Fair)", value: scheduleMetrics?.totalSchedules || 0 },
            { title: "Avg Schedules/Employee", value: scheduleMetrics?.avgSchedulesPerEmployee || "0.0" },
            { title: "Avg Fairness Score", value: fairnessMetrics?.averageScore.toFixed(2) || "0.00" },
            { title: "Fairness Index", value: fairnessMetrics?.fairnessIndex.toFixed(2) || "0.00" },
          ].map((metric, index) => (
            <Card key={index} className="bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">{metric.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-[#395B64]">{metric.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white dark:bg-gray-800 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-200">Fairness Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonChartData}>
                  <XAxis dataKey="name" stroke="#395B64" />
                  <YAxis yAxisId="left" orientation="left" stroke="#395B64" label={{ value: "Fairness Index / Avg Score", angle: -90, position: "insideLeft", fill: "#395B64" }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#395B64" label={{ value: "Total Penalty", angle: 90, position: "insideRight", fill: "#395B64" }} />
                  <Tooltip formatter={(value) => (typeof value === "number" ? value.toFixed(2) : value)} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="fairnessIndex" fill={COLORS[0]} name="Fairness Index (StdDev)" />
                  <Bar yAxisId="left" dataKey="averageScore" fill={COLORS[1]} name="Avg Fairness Score" />
                  <Bar yAxisId="right" dataKey="totalPenalty" fill={COLORS[2]} name="Total Penalty" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-200">Fair Greedy Schedule Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={scheduleMetrics?.pieData || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
                    {scheduleMetrics?.pieData?.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Employee Fairness Scores */}
        <Card className="bg-white dark:bg-gray-800 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-200">
              Employee Fairness Scores {apiDateRange ? `for ${apiDateRange.weekStart} to ${apiDateRange.to}` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {comparisonLoading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-[#395B64]" />
              </div>
            ) : comparisonData ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Employee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fairness Score</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                    {employees.map((employee) => {
                      const score = comparisonData.fairGreedy.scores[employee.id];
                      return (
                        <tr key={employee.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{employee.fullName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{score !== undefined ? score.toFixed(2) : "N/A"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400">Generate schedules and compare to see fairness scores.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}