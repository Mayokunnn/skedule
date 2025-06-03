import { useMutation, useQuery } from "@tanstack/react-query"
import api from "./axiosInstance"
import { AxiosError } from "axios"

interface SignupData {
  fullname: string
  email: string
  password: string
  position: string
  preferredDays: string[]
}

interface LoginData {
  email: string
  password: string
}

interface LoginResponse {
  message: string
  user: {
    id: string
    fullname: string
    email: string
    position: string
    preferredDays: string[]
  }
  token: string
}

interface RegisterResponse {
  message: string
  user: {
    id: string
    fullname: string
    email: string
    position: string
    preferredDays: string[]
  }
}

interface User {
  id: string
  fullname: string
  email: string
  position: string
  preferredDays: string[]
}

const signup = async (data: SignupData): Promise<RegisterResponse> => {
  try {
    const response = await api.post<RegisterResponse>("/auth/register", data)
    localStorage.setItem("userData", JSON.stringify(response.data.user))
    return response.data
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(error.response?.data.message || "Error registering user")
    }
    throw new Error("Unexpected error occurred")
  }
}

const login = async (data: LoginData): Promise<LoginResponse> => {
  try {
    const response = await api.post<LoginResponse>("/auth/login", data)
    localStorage.setItem("token", response.data.token)
    localStorage.setItem("userData", JSON.stringify(response.data.user))
    return response.data
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(error.response?.data.message || "Error during login")
    }
    throw new Error("Unexpected error occurred")
  }
}

const getUser = async (): Promise<User> => {
  try {
    const response = await api.get<User>("/auth/me")
    return response.data
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(error.response?.data.message || "Error getting user")
    }
    throw new Error("Unexpected error occurred")
  }
}

export const useSignupMutation = () => {
  return useMutation<RegisterResponse, Error, SignupData>({
    mutationFn: signup,
    onError: (error) => {
      console.error("Signup error:", error.message)
    },
    onSuccess: (data) => {
      console.log("Signup successful:", data)
    },
  })
}

export const useLoginMutation = () => {
  return useMutation<LoginResponse, Error, LoginData>({
    mutationFn: login,
    onError: (error) => {
      console.error("Login error:", error.message)
    },
    onSuccess: (data) => {
      console.log("Login successful:", data)
    },
  })
}

export const useGetUserQuery = () => {
  return useQuery<User, Error>({
    queryKey: ["user"],
    queryFn: getUser,
    // enabled: !!localStorage.getItem("token"), // Only run if token exists
    retry: false, // Don't retry on failure to avoid repeated unauthorized requests
  })
}