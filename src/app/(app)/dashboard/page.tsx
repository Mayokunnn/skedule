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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DatePickerWithRange } from "@/components/common/schedule/DatePicker";
import { DateRange as PickerDateRange } from "react-day-picker";
import { format, startOfDay, parseISO, startOfWeek, addDays } from "date-fns";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  const [dateRange, setDateRange] = React.useState<PickerDateRange | undefined>(
    () => {
      try {
        const saved =
          typeof window !== "undefined"
            ? localStorage.getItem("dateRange")
            : null;
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
    }
  );

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
    const weekStartZoned = startOfWeek(toZonedTime(dateRange.from, TIMEZONE), {
      weekStartsOn: 1,
    });
    const weekEndZoned = addDays(weekStartZoned, 4);
    return {
      from: format(fromZonedTime(weekStartZoned, TIMEZONE), "yyyy-MM-dd"),
      to: format(fromZonedTime(weekEndZoned, TIMEZONE), "yyyy-MM-dd"),
      weekStart: format(fromZonedTime(weekStartZoned, TIMEZONE), "yyyy-MM-dd"),
    };
  }, [dateRange]);

  // Fetch data
  const { data: employees = [], isLoading: employeesLoading } =
    useGetAllEmployeesQuery();
  const { data: schedules = [], isLoading: schedulesLoading } =
    useGetAllSchedulesQuery(apiDateRange?.weekStart ?? "");
  const {
    data: comparisonData,
    isPending: comparisonLoading,
  } = useCompareSchedulesQuery(apiDateRange);
  const fairGreedyMutation = useGenerateFairGreedyScheduleMutation();
  const basicGreedyMutation = useGenerateBasicGreedyScheduleMutation();
  const roundRobinMutation = useGenerateRoundRobinScheduleMutation();

  console.log(employees);

  // Compute schedule metrics
  const scheduleMetrics = React.useMemo(() => {
    if (!employees.length || !schedules.length || !apiDateRange) return null;
    const weekStart = startOfWeek(
      toZonedTime(parseISO(apiDateRange.weekStart), TIMEZONE),
      { weekStartsOn: 1 }
    );
    const weekEnd = addDays(weekStart, 4);
    const weekSchedules = schedules.filter((s) => {
      const scheduleDate = toZonedTime(parseISO(s.workday.date), TIMEZONE);
      return (
        scheduleDate >= weekStart &&
        scheduleDate <= weekEnd &&
        s.type === "FAIR"
      );
    });
    const totalSchedules = weekSchedules.length;
    const avgSchedulesPerEmployee = employees.length
      ? (totalSchedules / employees.length).toFixed(1)
      : "0.0";
    type Weekday = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
    const dayCounts: Record<Weekday, number> = {
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
    };
    weekSchedules.forEach((s) => {
      const scheduleDate = startOfDay(
        toZonedTime(parseISO(s.workday.date), TIMEZONE)
      );
      const day = format(scheduleDate, "EEEE") as Weekday;
      dayCounts[day]++;
    });
    const pieData = Object.entries(dayCounts).map(([name, value]) => ({
      name,
      value,
    }));
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
      {
        name: "Fair Greedy",
        fairnessIndex: comparisonData.fairGreedy.fairnessIndex,
        averageScore: comparisonData.fairGreedy.averageScore,
        totalPenalty: comparisonData.fairGreedy.totalPenalty,
      },
      {
        name: "Basic Greedy",
        fairnessIndex: comparisonData.basicGreedy.fairnessIndex,
        averageScore: comparisonData.basicGreedy.averageScore,
        totalPenalty: comparisonData.basicGreedy.totalPenalty,
      },
      {
        name: "Round Robin",
        fairnessIndex: comparisonData.roundRobin.fairnessIndex,
        averageScore: comparisonData.roundRobin.averageScore,
        totalPenalty: comparisonData.roundRobin.totalPenalty,
      },
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
        queryClient.invalidateQueries({
          queryKey: ["allSchedules", apiDateRange.weekStart],
        });
        queryClient.invalidateQueries({
          queryKey: ["compareSchedules", apiDateRange.weekStart],
        });
        if (data.length === 0 || (Array.isArray(data) && data[0] === "yooo")) {
          toast.info("Week Already Scheduled", {
            description: `Schedules for ${apiDateRange.weekStart} exist.`,
          });
        } else {
          toast.success("Schedule Generated", {
            description: `${
              type.charAt(0).toUpperCase() + type.slice(1)
            } schedule generated.`,
          });
        }
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
        toast.error("Error", { description: message });
      },
    });
  };

  const isLoading =
    employeesLoading ||
    schedulesLoading ||
    comparisonLoading ||
    fairGreedyMutation.isPending ||
    basicGreedyMutation.isPending ||
    roundRobinMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-[#395B64]" />
      </div>
    );
  }

  return (
    <div className="p-1 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">Dashboard</h1>
        <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Schedule Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            {scheduleMetrics ? (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Employees:</span>
                  <span>{scheduleMetrics.totalEmployees}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Schedules:</span>
                  <span>{scheduleMetrics.totalSchedules}</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Schedules/Employee:</span>
                  <span>{scheduleMetrics.avgSchedulesPerEmployee}</span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={scheduleMetrics.pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {scheduleMetrics.pieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <p>Loading metrics...</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Fairness Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            {fairnessMetrics ? (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Average Score:</span>
                  <span>{fairnessMetrics.averageScore.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fairness Index:</span>
                  <span>{fairnessMetrics.fairnessIndex.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Schedules:</span>
                  <span>{fairnessMetrics.totalSchedules}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Penalty:</span>
                  <span>{fairnessMetrics.totalPenalty.toFixed(2)}</span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonChartData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="fairnessIndex" fill="#8884d8" />
                      <Bar dataKey="averageScore" fill="#82ca9d" />
                      <Bar dataKey="totalPenalty" fill="#ffc658" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <p>Loading fairness metrics...</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Generate Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                onClick={() => handleGenerate("fair")}
                disabled={fairGreedyMutation.isPending}
                className="w-full"
              >
                {fairGreedyMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="mr-2 h-4 w-4" />
                )}
                Generate Fair Greedy Schedule
              </Button>
              <Button
                onClick={() => handleGenerate("basic")}
                disabled={basicGreedyMutation.isPending}
                className="w-full"
              >
                {basicGreedyMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="mr-2 h-4 w-4" />
                )}
                Generate Basic Greedy Schedule
              </Button>
              <Button
                onClick={() => handleGenerate("roundRobin")}
                disabled={roundRobinMutation.isPending}
                className="w-full"
              >
                {roundRobinMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="mr-2 h-4 w-4" />
                )}
                Generate Round Robin Schedule
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
       {/* Fairness Table */}
      <div className="mt-10">
        <Card>
          <CardHeader>
            <CardTitle>Employee Fairness Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Fairness Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell>{emp.fullName}</TableCell>
                    <TableCell className="text-right font-medium">
                      {emp.fairnessScore ?? "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
