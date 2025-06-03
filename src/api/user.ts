import { useQuery } from "@tanstack/react-query"
import api from "./axiosInstance"
import { AxiosError } from "axios"

interface User {
  id: string
  email: string
  fullName: string
  position: string
  role: string
  createdAt: string
  schedules: {
    id: string
    workdayId: string
    assignedById: string
    createdAt: string
  }[]
}

interface Employee {
  id: string
  email: string
  fullName: string
  position: string
  role: string
  createdAt: string
  schedules: {
    id: string
    workdayId: string
    assignedById: string
    createdAt: string
    workday: {
      date: string
    }
  }[]
}


// Get All Users
const getAllUsers = async (): Promise<User[]> => {
  try {
    const response = await api.get<User[]>("/users")
    return response.data
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(error.response?.data.message || "Error fetching users")
    }
    throw new Error("Unexpected error occurred")
  }
}

// Get All Employees
const getAllEmployees = async (): Promise<Employee[]> => {
  try {
    const response = await api.get<Employee[]>("/users/employees")
    console.log(response.data);
    return response.data
  } catch (error) {
    console.log(error);
    if (error instanceof AxiosError) {
      throw new Error(error.response?.data.message || "Error fetching employees")
    }
    throw new Error("Unexpected error occurred")
  }
}

export const useGetAllUsersQuery = () => {
  return useQuery<User[], Error>({
    queryKey: ["users"],
    queryFn: getAllUsers,
    retry: false,
  })
}

export const useGetAllEmployeesQuery = () => {
  return useQuery<Employee[], Error>({
    queryKey: ["employees"],
    queryFn: getAllEmployees,
    retry: false,
  })
}