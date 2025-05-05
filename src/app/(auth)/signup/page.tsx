"use client"

import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { LockIcon, MailIcon, UserIcon } from "lucide-react"

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"

const formSchema = z
  .object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export default function SignUp() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log("Form submitted:", values)
    // Add your signup logic here
  }

  return (
    <div className="bg-black max-w-7xl w-full relative flex items-center justify-center text-white min-h-screen px-4">
      <div className="absolute z-10 top-8 left-8">
        <h1 className="text-[#395B64] text-4xl">Skedule.</h1>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6 items-center w-full">
          <div className="flex flex-col items-center justify-center gap-4">
            <h2 className="font-semibold text-4xl">Create an Account</h2>
            <h4 className="text-xl">Sign up to start managing your schedule</h4>
          </div>

          <div className="flex flex-col gap-6 items-center w-full">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="w-full max-w-sm">
                  <div className="border-[#395B64] border-2 rounded-full px-5 py-3 w-full flex items-center gap-2">
                    <UserIcon />
                    <FormControl>
                      <Input
                        className="border-0 placeholder:font-bold placeholder:text-white bg-transparent text-white focus-visible:ring-0 focus-visible:ring-offset-0"
                        placeholder="Enter Your Name"
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage className="text-red-500 mt-1 px-2" />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="w-full max-w-sm">
                  <div className="border-[#395B64] border-2 rounded-full px-5 py-3 w-full flex items-center gap-2">
                    <MailIcon />
                    <FormControl>
                      <Input
                        className="border-0 placeholder:font-bold placeholder:text-white bg-transparent text-white focus-visible:ring-0 focus-visible:ring-offset-0"
                        placeholder="Enter Your Email"
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage className="text-red-500 mt-1 px-2" />
                </FormItem>
              )}
            />

            {/* Password */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="w-full max-w-sm">
                  <div className="border-[#395B64] border-2 rounded-full px-5 py-3 w-full flex items-center gap-2">
                    <LockIcon />
                    <FormControl>
                      <Input
                        type="password"
                        className="border-0 placeholder:font-bold placeholder:text-white bg-transparent text-white focus-visible:ring-0 focus-visible:ring-offset-0"
                        placeholder="Enter Your Password"
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage className="text-red-500 mt-1 px-2" />
                </FormItem>
              )}
            />

            {/* Confirm Password */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem className="w-full max-w-sm">
                  <div className="border-[#395B64] border-2 rounded-full px-5 py-3 w-full flex items-center gap-2">
                    <LockIcon />
                    <FormControl>
                      <Input
                        type="password"
                        className="border-0 placeholder:font-bold placeholder:text-white bg-transparent text-white focus-visible:ring-0 focus-visible:ring-offset-0"
                        placeholder="Confirm Password"
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage className="text-red-500 mt-1 px-2" />
                </FormItem>
              )}
            />

            <div className="text-sm flex justify-between items-center w-full max-w-sm px-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="terms" className="checked:bg-white" />
                <label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I agree to the Terms
                </label>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="rounded-full h-12 bg-[#395B64] text-white w-full p-3 max-w-sm text-lg cursor-pointer hover:bg-[#2f4d56]"
            >
              Sign Up
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
