/* eslint-disable @next/next/no-img-element */
"use client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Home() {

  const router= useRouter();

  return (
    <div className="grid grid-rows-[auto_1fr] h-screen text-lg text-[#395B64] font-semibold bg-[#F9FAFC]">
      <div className="mx-auto w-full p-5 flex justify-between items-scenter container">
        <div>
          <h1 className="font-bold text-3xl">Skedule</h1>
        </div>
        <ul className="flex gap-6 text-[#828384] font-normal py-3">
          <li>Product</li>
          <li>Pricing</li>
          <li>Resources</li>
        </ul>
        <Button className="text-[#395B64] text-lg bg-[#DDE3E5] px-3 py-2 hover:bg-[#c8c9c9] cursor-pointer hover:text-[#395B64] w-36 h-12">
          Login
        </Button>
      </div>
      <div className="h-full  flex flex-col items-center gap-8 p-12">
        <div className=" flex flex-col items-center gap-6 max-w-4xl text-center">
          <h2 className="text-4xl font-semibold">
            The leading employee scheduling software to help you schedule your
            team in minutes
          </h2>
          <p className="text-[#828384] font-normal">
            Get set up quickly for efficiently online scheduling that will save
            you hours
          </p>
          <Button onClick={() => router.push("/dashboard")} className="bg-[#395B64] text-lg text-[#DDE3E5] px-3 py-2  cursor-pointer hover:bg-[#284046] w-36 h-12">
            Get Started
          </Button>
        </div>
        <div className="max-w-6xl">
          <img src="/hero.svg" alt="Hero Dashboard"/>
        </div>
      </div>
    </div>
  );
}
