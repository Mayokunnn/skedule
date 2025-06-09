"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSignupMutation, useLoginMutation } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { BriefcaseIcon, LockIcon, MailIcon, UserIcon } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useRouter } from "next/navigation";
import Link from "next/link";

const VALID_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
] as const;

const formSchema = z
  .object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    email: z.string().email({ message: "Invalid email address" }),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z.string(),
    position: z
      .string()
      .min(2, { message: "Position must be at least 2 characters" }),
    preferredDays: z
      .array(z.enum(VALID_DAYS))
      .length(2, { message: "Please select exactly 2 preferred days" }),
    terms: z
      .boolean()
      .refine((val) => val === true, {
        message: "You must agree to the terms",
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function SignUp() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      position: "",
      preferredDays: [],
      terms: false,
    },
  });

  const router = useRouter();

  const {
    mutate: signup,
    isPending: isSignupPending,
    error: signupError,
  } = useSignupMutation();
  const {
    mutate: login,
    isPending: isLoginPending,
    error: loginError,
  } = useLoginMutation();

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    signup(
      {
        fullname: values.name,
        email: values.email,
        password: values.password,
        position: values.position,
        preferredDays: values.preferredDays,
      },
      {
        onSuccess: (data) => {
          console.log(data.message); // e.g., "User registered successfully"
          login(
            {
              email: values.email,
              password: values.password,
            },
            {
              onSuccess: (loginData) => {
                console.log(loginData.message); // e.g., "Login successful"
                router.push("/dashboard"); // Redirect to dashboard after successful login
              },
              onError: (error) => {
                console.error(error.message); // e.g., "Invalid credentials"
              },
            }
          );
        },
        onError: (error) => {
          console.error(error.message); // e.g., "User already exists"
        },
      }
    );
  };

  return (
    <div className="bg-black max-w-7xl w-full relative flex items-center justify-center text-white min-h-screen px-4">
      <div className="absolute z-10 top-8 left-8">
        <h1 className="text-[#395B64] text-4xl">Skedule.</h1>
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-6 items-center w-full"
        >
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

            {/* Position */}
            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem className="w-full max-w-sm">
                  <div className="border-[#395B64] border-2 rounded-full px-5 py-3 w-full flex items-center gap-2">
                    <BriefcaseIcon />
                    <FormControl>
                      <Input
                        className="border-0 placeholder:font-bold placeholder:text-white bg-transparent text-white focus-visible:ring-0 focus-visible:ring-offset-0"
                        placeholder="Enter Your Position"
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage className="text-red-500 mt-1 px-2" />
                </FormItem>
              )}
            />

            {/* Preferred Days */}
            <FormField
              control={form.control}
              name="preferredDays"
              render={({ field }) => (
                <FormItem className="w-full max-w-sm">
                  <FormLabel className="text-white">
                    Preferred Work Days (select exactly 2)
                  </FormLabel>
                  <div className="flex flex-wrap gap-4">
                    {VALID_DAYS.map((day) => (
                      <div key={day} className="flex items-center space-x-2">
                        <Checkbox
                          id={day}
                          checked={field.value.includes(day)}
                          onCheckedChange={(checked) => {
                            const newValue = checked
                              ? [...field.value, day]
                              : field.value.filter((d: string) => d !== day);
                            field.onChange(newValue);
                          }}
                          className="checked:bg-white"
                        />
                        <label
                          htmlFor={day}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {day}
                        </label>
                      </div>
                    ))}
                  </div>
                  <FormMessage className="text-red-500 mt-1" />
                </FormItem>
              )}
            />

            {/* Terms Checkbox */}
            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem className="w-full max-w-sm">
                  <div className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        id="terms"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="checked:bg-white"
                      />
                    </FormControl>
                    <label
                      htmlFor="terms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I agree to the Terms
                    </label>
                  </div>
                  <FormMessage className="text-red-500 mt-1" />
                </FormItem>
              )}
            />

            {/* Error Messages */}
            {(signupError || loginError) && (
              <p className="text-red-500 text-sm w-full max-w-sm">
                {signupError?.message || loginError?.message}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="rounded-full h-12 bg-[#395B64] text-white w-full p-3 max-w-sm text-lg cursor-pointer hover:bg-[#2f4d56] flex items-center justify-center gap-2"
              disabled={isSignupPending || isLoginPending}
            >
              {isSignupPending || isLoginPending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  Signing Up...
                </>
              ) : (
                "Sign Up"
              )}
            </Button>

            <p className="text-sm text-gray-200 w-full max-w-sm text-center">
              Already have an account?{" "}
              <Link href="/signin" className="text-white hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </form>
      </Form>
    </div>
  );
}
