"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useRouter } from "next/navigation";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Footer from "@/components/Footer";

export default function Home() {
  const router = useRouter();
  return (
    <div className="w-full min-h-screen bg-white text-black flex flex-col">
      {/* Navbar */}
      <header className="max-w-6xl mx-auto w-full flex justify-between items-center h-20 px-4">
        <div className="text-2xl md:text-3xl font-bold tracking-tight">
          Atomic <span className="text-blue-600">Habits</span>
        </div>
        <div className="flex gap-4">
          <Button className="px-6 py-3 rounded-xl" onClick={() => router.push('/auth')}>
            Get Started
          </Button>
        </div>
      </header>
      <Separator />

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center py-20 px-6 md:px-12">
        <h1 className="text-4xl md:text-6xl font-extrabold max-w-4xl leading-tight">
          Build <span className="text-blue-600">habits</span> that compound into{" "}
          <span className="underline decoration-yellow-400">success</span>.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-gray-600">
          Inspired by James Clear&apos;s{" "}
          <span className="font-semibold">Atomic Habits</span>, this app helps
          you track, share, and grow habits with accountability — one small step
          at a time.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Button size="lg" className="px-8 py-4 rounded-xl text-base" onClick={() => router.push('/auth')}>
            Get Started
          </Button>
          <Button size="lg" variant="outline" className="px-8 py-4 rounded-xl text-base" onClick={() => router.push('#learn-more')}>
            Learn More
          </Button>
        </div>
      </section>

      {/* Content*/}
      <section className="py-16 px-6 md:px-12 max-w-6xl mx-auto w-full">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          <div className="flex-1 text-center lg:text-left">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              The Power of Small Changes
            </h2>
            <blockquote className="text-xl md:text-2xl text-gray-800 leading-relaxed mb-6 italic">
              &quot;Habits are the compound interest of self-improvement.&quot;
            </blockquote>
            <p className="text-lg text-gray-600 font-semibold">
              – James Clear
            </p>
            <p className="mt-6 text-gray-600 leading-relaxed">
              Just like in the book{" "}
              <span className="underline decoration-blue-400">Atomic Habits</span>,
              our app helps you build consistency, track progress, and stay
              accountable to achieve meaningful growth over time.
            </p>
          </div>

          {/* Book Image */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <img
                src="/atomic-habits(1).jpg"
                alt="Atomic Habits book cover"
                className="w-full h-auto rounded-lg shadow-2xl transform hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-6 md:px-12 max-w-6xl mx-auto w-full bg-gray-50 rounded-2xl my-16" id="#learn-more">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Start your habit journey in four simple steps
          </p>
        </div>

        <Carousel className="w-full max-w-4xl mx-auto">
          <CarouselContent>
            <CarouselItem className="flex flex-col items-center text-center p-8 space-y-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-2xl font-semibold">Create Your Account</h3>
              <p className="text-gray-600 max-w-md leading-relaxed">
                Sign up in seconds and start your journey toward better habits with a personalized dashboard.
              </p>
            </CarouselItem>

            <CarouselItem className="flex flex-col items-center text-center p-8 space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-2xl font-semibold">Follow & Connect</h3>
              <p className="text-gray-600 max-w-md leading-relaxed">
                Choose at least 3 people to follow so your feed is filled with real accountability and motivation.
              </p>
            </CarouselItem>

            <CarouselItem className="flex flex-col items-center text-center p-8 space-y-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-yellow-600">3</span>
              </div>
              <h3 className="text-2xl font-semibold">Share Your Habits</h3>
              <p className="text-gray-600 max-w-md leading-relaxed">
                Post your progress as <strong>atoms</strong> with captions and images, keeping yourself and others motivated.
              </p>
            </CarouselItem>

            <CarouselItem className="flex flex-col items-center text-center p-8 space-y-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-purple-600">4</span>
              </div>
              <h3 className="text-2xl font-semibold">Track & Improve</h3>
              <p className="text-gray-600 max-w-md leading-relaxed">
                Stay on top of your personal and shareable habits with streaks, stars, and comprehensive statistics.
              </p>
            </CarouselItem>
          </CarouselContent>

          <div className="flex justify-center gap-4 mt-8">
            <CarouselPrevious className="static translate-y-0" />
            <CarouselNext className="static translate-y-0" />
          </div>
        </Carousel>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 md:px-12 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Frequently asked questions
            </h2>
            <p className="text-gray-600 mb-6"> 
              This is an assignment given by exp.club to build a habit tracking application.
            </p>
            <Button
              variant="outline"
              className="px-6 py-3 rounded-xl"
              onClick={() => window.open("https://exp.club", "_blank")}
            >
              exp.club
            </Button>
          </div>

          <div>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>
                  How does Atomic Habits work?
                </AccordionTrigger>
                <AccordionContent>
                  You create habits, track them daily, and share progress
                  publicly or privately with your peers for accountability.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>
                  Do I need to share my personal habits publicly?
                </AccordionTrigger>
                <AccordionContent>
                  Not at all! Habis can either be sharable or personal. You are yourself accountable for personal habits without sharing.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>
                  What's the time commitment?
                </AccordionTrigger>
                <AccordionContent>
                  Just a few minutes a day to log and share your habits — it’s
                  designed to fit into your routine.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>
                  How do streaks & karma work?
                </AccordionTrigger>
                <AccordionContent>
                  Completing habits earns you streaks and stars. Staying
                  consistent builds your karma score, which ranks you on the
                  leaderboard.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      <Separator />

      <Footer />
    </div>
  );
}