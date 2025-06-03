"use client";

import * as React from "react";
import {
  useCompareSchedulesMutation,
  useGenerateFairGreedyScheduleMutation,
  useGenerateBasicGreedyScheduleMutation,
  useGenerateRoundRobinScheduleMutation,
  useGetAllSchedulesQuery,
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
        console.log("Saved dateRange:", dateRange);
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

  // Invalidate queries when date range changes
  React.useEffect(() => {
    if (apiDateRange?.weekStart) {
      console.log("Invalidating queries for:", apiDateRange.weekStart);
      queryClient.invalidateQueries({ queryKey: ["allSchedules", apiDateRange.weekStart] });
      queryClient.invalidateQueries({ queryKey: ["compareSchedules", apiDateRange.weekStart] });
    }
  }, [apiDateRange?.weekStart, queryClient]);

  // Fetch data
  const { data: employees, isLoading: employeesLoading } = useGetAllEmployeesQuery();
  const { data: schedules, isLoading: schedulesLoading } = useGetAllSchedulesQuery(
    apiDateRange?.weekStart ?? ""
  );
  const compareMutation = useCompareSchedulesMutation();
  const fairGreedyMutation = useGenerateFairGreedyScheduleMutation();
  const basicGreedyMutation = useGenerateBasicGreedyScheduleMutation();
  const roundRobinMutation = useGenerateRoundRobinScheduleMutation();

  // Compute schedule metrics
  const scheduleMetrics = React.useMemo(() => {
    if (!employees || !schedules || !apiDateRange) return null;

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
      const day = format(scheduleDate, "EEEE");
      if (day in dayCounts) dayCounts[day as Weekday]++;
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
    if (!compareMutation.data || !apiDateRange) return null;

    const fairGreedy = compareMutation.data.fairGreedy;

    // Warn about validation issues
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
    // Removed over-assigned workdays warning as 'validation' does not exist on CompareResponse

    return {
      averageScore: fairGreedy.averageScore,
      fairnessIndex: fairGreedy.fairnessIndex,
      totalSchedules: fairGreedy.total,
      totalPenalty: fairGreedy.totalPenalty,
    };
  }, [compareMutation.data, apiDateRange]);

  // Prepare comparison data for chart
  const comparisonData = React.useMemo(() => {
    if (!compareMutation.data) {
      console.log("Compare mutation data empty");
      return [];
    }
    return [
      {
        name: "Fair Greedy",
        fairnessIndex: compareMutation.data.fairGreedy.fairnessIndex,
        averageScore: compareMutation.data.fairGreedy.averageScore,
        totalPenalty: compareMutation.data.fairGreedy.totalPenalty,
        totalSchedules: compareMutation.data.fairGreedy.total,
      },
      {
        name: "Basic Greedy",
        fairnessIndex: compareMutation.data.basicGreedy.fairnessIndex,
        averageScore: compareMutation.data.basicGreedy.averageScore,
        totalPenalty: compareMutation.data.basicGreedy.totalPenalty,
        totalSchedules: compareMutation.data.basicGreedy.total,
      },
      {
        name: "Round Robin",
        fairnessIndex: compareMutation.data.roundRobin.fairnessIndex,
        averageScore: compareMutation.data.roundRobin.averageScore,
        totalPenalty: compareMutation.data.roundRobin.totalPenalty,
        totalSchedules: compareMutation.data.roundRobin.total,
      },
    ];
  }, [compareMutation.data]);

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
        if (data.length === 0 || (Array.isArray(data) && data[0] === "yooo")) {
          toast.info("Week Already Scheduled", {
            description: `Schedules for ${apiDateRange.weekStart} exist.`,
          });
        } else {
          toast.success("Schedule Generated", {
            description: `${type.charAt(0).toUpperCase() + type.slice(1)} schedule generated.`,
          });
        }
        handleCompareSchedules(); // Auto-compare after generation
      },
      onError: (error: unknown) => {
        let message = "Failed to generate schedule.";
        if (
          error &&
          typeof error === "object" &&
          "message" in error &&
          typeof (error as { message?: unknown }).message === "string"
        ) {
          message = (error as { message: string }).message;
        }
        toast.error("Error", {
          description: message,
        });
      },
    });
  };

  // Handle schedule comparison
  const handleCompareSchedules = () => {
    if (!apiDateRange) return;
    compareMutation.mutate(apiDateRange, {
      onSuccess: () => {
        toast.success("Comparison Generated", {
          description: `Schedules compared for ${apiDateRange.weekStart}.`,
        });
        queryClient.invalidateQueries({ queryKey: ["allSchedules", apiDateRange.weekStart] });
        queryClient.invalidateQueries({ queryKey: ["compareSchedules", apiDateRange.weekStart] });
      },
      onError: (error: unknown) => {
        let message = "Failed to compare schedules.";
        if (
          error &&
          typeof error === "object" &&
          "message" in error &&
          typeof (error as { message?: unknown }).message === "string"
        ) {
          message = (error as { message: string }).message;
        }
        toast.error("Error", {
          description: message,
        });
        console.error("Compare mutation failed:", error);
      },
    });
  };

  const isLoading =
    employeesLoading ||
    schedulesLoading ||
    compareMutation.isPending ||
    fairGreedyMutation.isPending ||
    basicGreedyMutation.isPending ||
    roundRobinMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#395B64]" />
      </div>
    );
  }

  return (
    <div className="p-6 text-[#395B64] bg-gray-50 dark:bg-gray-900">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-black dark:text-white">Scheduling Dashboard</h1>
        <DatePickerWithRange
          className="w-full max-w-[300px] bg-white dark:bg-gray-800"
          date={dateRange}
          onDateChange={(date) => {
            console.log("Dashboard received date:", date);
            setDateRange(date);
          }}
        />
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card className="bg-white dark:bg-gray-800 shadow-md">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[#395B64]">{scheduleMetrics?.totalEmployees || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 shadow-md">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Schedules (Fair)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[#395B64]">{scheduleMetrics?.totalSchedules || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 shadow-md">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Avg Schedules/Employee</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[#395B64]">{scheduleMetrics?.avgSchedulesPerEmployee || "0.0"}</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 shadow-md">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Avg Fairness Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[#395B64]">
              {fairnessMetrics?.averageScore.toFixed(2) || "0.00"}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 shadow-md">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Fairness Index</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[#395B64]">
              {fairnessMetrics?.fairnessIndex.toFixed(2) || "0.00"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Generate Schedules */}
      <Card className="mb-6 bg-white dark:bg-gray-800 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-200">Generate & Compare Schedules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={() => handleGenerate("fair")}
              disabled={fairGreedyMutation.isPending || !apiDateRange}
              className="bg-[#395B64] text-white hover:bg-[#2A4A52]"
            >
              {fairGreedyMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCcw className="h-4 w-4 mr-2" />
              )}
              Generate Fair Greedy
            </Button>
            <Button
              onClick={() => handleGenerate("basic")}
              disabled={basicGreedyMutation.isPending || !apiDateRange}
              className="bg-[#FF6384] text-white hover:bg-[#E5395A]"
            >
              {basicGreedyMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCcw className="h-4 w-4 mr-2" />
              )}
              Generate Basic Greedy
            </Button>
            <Button
              onClick={() => handleGenerate("roundRobin")}
              disabled={roundRobinMutation.isPending || !apiDateRange}
              className="bg-[#4BC0C0] text-white hover:bg-[#3A9A9A]"
            >
              {roundRobinMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCcw className="h-4 w-4 mr-2" />
              )}
              Generate Round Robin
            </Button>
            <Button
              onClick={handleCompareSchedules}
              disabled={compareMutation.isPending || !apiDateRange}
              className="bg-[#36A2EB] text-white hover:bg-[#2A80B9]"
            >
              {compareMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCcw className="h-4 w-4 mr-2" />
              )}
              Compare Schedules
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white dark:bg-gray-800 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-200">Fairness Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <XAxis dataKey="name" stroke="#395B64" />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  stroke="#395B64"
                  label={{ value: "Fairness Index / Avg Score", angle: -90, position: "insideLeft", fill: "#395B64" }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#395B64"
                  label={{ value: "Total Penalty", angle: 90, position: "insideRight", fill: "#395B64" }}
                />
                <Tooltip
                  formatter={(value, name) => [typeof value === "number" ? value.toFixed(2) : value, name]}
                  contentStyle={{ backgroundColor: "#fff", border: "1px solid #ccc" }}
                />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="fairnessIndex"
                  fill={COLORS[0]}
                  name="Fairness Index (StdDev)"
                />
                <Bar
                  yAxisId="left"
                  dataKey="averageScore"
                  fill={COLORS[1]}
                  name="Avg Fairness Score"
                />
                <Bar
                  yAxisId="right"
                  dataKey="totalPenalty"
                  fill={COLORS[2]}
                  name="Total Penalty"
                />
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
                <Pie
                  data={scheduleMetrics?.pieData || []}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, value }) => `${name}: ${value}`}
                >
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
    </div>
  );
}