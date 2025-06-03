import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import api from "./axiosInstance"
import { AxiosError } from "axios"

interface DateRange {
  from: string // ISO date string, e.g., "2025-06-01"
  to: string // ISO date string, e.g., "2025-06-30"
  weekStart: string // ISO date string, e.g., "2025-06-16" (Monday of the week)
}

interface AssignScheduleData {
  employeeId: string
  date: string // ISO date string, e.g., "2025-06-16"
}

interface ScheduleResult {
  id: string
  workdayId: string
  employeeId: string
  assignedById: string
  workday?: {
    id: string
    date: string
  }
}

interface FairnessMetric {
  total: number
  fairnessIndex: number
  scores: Record<string, number>
}

interface CompareResponse {
  fairGreedy: FairnessMetric
  basicGreedy: FairnessMetric
  random: FairnessMetric
  roundRobin: FairnessMetric
}

interface Schedule {
  id: string
  workdayId: string
  employeeId: string
  assignedById: string
  type: string
  createdAt: string
  employee: {
    id: string
    fullName: string
    email: string
    preferredDays: string[]
  }
  workday: {
    id: string
    date: string
  }
  assignedBy: {
    id: string
    fullName: string
    email: string
  }
}

interface ScheduleResult {
  id: string
  workdayId: string
  employeeId: string
  assignedById: string
  workday?: {
    id: string
    date: string
  }
}

interface FairnessMetric {
  total: number;
  averageScore: number;
  fairnessIndex: number;
  scores: Record<string, number>;
  totalPenalty: number;
  preferredDaysCount: Record<string, number>;
  nonPreferredDaysCount: Record<string, number>;
  totalDaysCount: Record<string, number>;
  outOfBounds: string[];
  invalidAssignments: string[];
}

interface CompareResponse {
  fairGreedy: FairnessMetric;
  basicGreedy: FairnessMetric;
  roundRobin: FairnessMetric;
}

// Generate Fair Greedy Schedule
const generateFairGreedySchedule = async (data: DateRange): Promise<ScheduleResult[]> => {
  try {
    console.log(data);
    const response = await api.post<{ message: string; result: ScheduleResult[] }>("/schedule/fair", data)
    getAllSchedules() // Invalidate cache to refresh schedules
    return response.data.result
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(error.response?.data.message || "Error generating fair greedy schedule")
    }
    throw new Error("Unexpected error occurred")
  }
}



// Generate Basic Greedy Schedule
const generateBasicGreedySchedule = async (data: DateRange): Promise<ScheduleResult[]> => {
  try {
    console.log("Generating Basic Greedy Schedule:", data);
    const response = await api.post<{ message: string; result: ScheduleResult[] }>("/schedule/basic", data)
    return response.data.result
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(error.response?.data.message || "Error generating basic greedy schedule")
    }
    throw new Error("Unexpected error occurred")
  }
}

// Generate Round Robin Schedule
const generateRoundRobinSchedule = async (data: DateRange): Promise<ScheduleResult[]> => {
  try {
    console.log("Generating Round Robin Schedule:", data);
    const response = await api.post<{ message: string; result: ScheduleResult[] }>("/schedule/round-robin", data)
    return response.data.result
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(error.response?.data.message || "Error generating round robin schedule")
    }
    throw new Error("Unexpected error occurred")
  }
}

// Generate Random Schedule
const generateRandomSchedule = async (data: DateRange): Promise<ScheduleResult[]> => {
  try {
    console.log("Generating Random Schedule:", data);
    const response = await api.post<{ message: string; result: ScheduleResult[] }>("/schedule/random", data)
    return response.data.result
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(error.response?.data.message || "Error generating random schedule")
    }
    throw new Error("Unexpected error occurred")
  }
}

// Assign Single Schedule
const assignSingleSchedule = async (data: AssignScheduleData): Promise<Schedule> => {
  try {
    console.log("Assigning Single Schedule:", data);
    const response = await api.post<{ message: string; schedule: Schedule }>("/schedule/assign", data)
    return response.data.schedule
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(error.response?.data.message || "Error assigning schedule")
    }
    throw new Error("Unexpected error occurred")
  }
}

// Compare Schedules
const compareSchedules = async (data: DateRange): Promise<CompareResponse> => {
  try {
    console.log("Comparing Schedules:", data);
    const response = await api.get<CompareResponse>(`/schedule/evaluate?weekStart=${data.weekStart}`,)
    return response.data
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(error.response?.data.message || "Error comparing schedules")
    }
    throw new Error("Unexpected error occurred")
  }
}

// Get All Schedules
const getAllSchedules = async (weekStart?: string): Promise<Schedule[]> => {
  try {
    const params = weekStart ? { weekStart } : {};
    const response = await api.get<Schedule[]>("/schedule", { params })
    return response.data
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(error.response?.data.message || "Error fetching schedules")
    }
    throw new Error("Unexpected error occurred")
  }
}

// Get My Schedules
const getMySchedules = async (weekStart?: string): Promise<Schedule[]> => {
  try {
    const params = weekStart ? { weekStart } : {};
    console.log("Fetching My Schedules:", params);
    const response = await api.get<Schedule[]>("/schedule/my", { params })
    return response.data
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(error.response?.data.message || "Error fetching my schedules")
    }
    throw new Error("Unexpected error occurred")
  }
}

export const useGenerateFairGreedyScheduleMutation = () => {
  const queryClient = useQueryClient()
  return useMutation<ScheduleResult[], Error, DateRange>({
    mutationFn: generateFairGreedySchedule,
    onError: (error) => {
      console.log(error);
  },
    onSuccess: (data) => {
      console.log("Fair Greedy Schedule generated:", data)
      queryClient.invalidateQueries({ queryKey: ["allSchedules"] })
      queryClient.invalidateQueries({ queryKey: ["mySchedules"] })
    },
  })
}

export const useGenerateBasicGreedyScheduleMutation = () => {
  const queryClient = useQueryClient()
  return useMutation<ScheduleResult[], Error, DateRange>({
    mutationFn: generateBasicGreedySchedule,
    onError: (error) => {
      console.error("Basic Greedy Schedule error:", error.message)
    },
    onSuccess: (data) => {
      console.log("Basic Greedy Schedule generated:", data)
      queryClient.invalidateQueries({ queryKey: ["allSchedules"] })
      queryClient.invalidateQueries({ queryKey: ["mySchedules"] })
    },
  })
}

export const useGenerateRoundRobinScheduleMutation = () => {
  const queryClient = useQueryClient()
  return useMutation<ScheduleResult[], Error, DateRange>({
    mutationFn: generateRoundRobinSchedule,
    onError: (error) => {
      console.error("Round Robin Schedule error:", error.message)
    },
    onSuccess: (data) => {
      console.log("Round Robin Schedule generated:", data)
      queryClient.invalidateQueries({ queryKey: ["allSchedules"] })
      queryClient.invalidateQueries({ queryKey: ["mySchedules"] })
    },
  })
}

export const useGenerateRandomScheduleMutation = () => {
  const queryClient = useQueryClient()
  return useMutation<ScheduleResult[], Error, DateRange>({
    mutationFn: generateRandomSchedule,
    onError: (error) => {
      console.error("Random Schedule error:", error.message)
    },
    onSuccess: (data) => {
      console.log("Random Schedule generated:", data)
      queryClient.invalidateQueries({ queryKey: ["allSchedules"] })
      queryClient.invalidateQueries({ queryKey: ["mySchedules"] })
    },
  })
}

export const useAssignSingleScheduleMutation = () => {
  const queryClient = useQueryClient()
  return useMutation<Schedule, Error, AssignScheduleData>({
    mutationFn: assignSingleSchedule,
    onError: (error) => {
      console.error("Assign Schedule error:", error.message)
    },
    onSuccess: (data) => {
      console.log("Schedule assigned:", data)
      queryClient.invalidateQueries({ queryKey: ["allSchedules"] })
      queryClient.invalidateQueries({ queryKey: ["mySchedules"] })
    },
  })
}

export const useCompareSchedulesMutation = () => {
  const queryClient = useQueryClient()
  return useMutation<CompareResponse, Error, DateRange>({
    mutationFn: compareSchedules,
    onError: (error) => {
      console.error("Compare Schedules error:", error.message)
    },
    onSuccess: (data) => {
      console.log("Schedules compared:", data)
      queryClient.invalidateQueries({ queryKey: ["allSchedules"] })
      queryClient.invalidateQueries({ queryKey: ["mySchedules"] })
    },
  })
}

export const useGetAllSchedulesQuery = (weekStart?: string) => {
  return useQuery<Schedule[], Error>({
    queryKey: ["allSchedules", weekStart],
    queryFn: () => getAllSchedules(weekStart),
    enabled: true,
  })
}

export const useGetMySchedulesQuery = (weekStart?: string) => {
  return useQuery<Schedule[], Error>({
    queryKey: ["mySchedules", weekStart],
    queryFn: () => getMySchedules(weekStart),
    enabled: true,
  })
}