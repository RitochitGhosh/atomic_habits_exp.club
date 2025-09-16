"use client"

import React, { useState } from "react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/providers/providers";

const navList = [
  { name: "Feed", href: "/dashboard" },
  { name: "Habits", href: "/dashboard/habits" },
  { name: "Track", href: "/dashboard/track" },
  { name: "Profile", href: "/dashboard/profile" },
  { name: "Leaderboard", href: "/dashboard/leaderboard" },
];

const Header = () => {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { user, setUser } = useAuth(); // also grab setUser

  // Get user initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0]?.toUpperCase())
      .slice(0, 2)
      .join("");
  };

  const handleSignOut = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token) {
        await fetch("http://localhost:3001/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      // Clear tokens + reset user
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setUser(null);
      router.push("/auth");
    }
  };

  return (
    <header className="w-full border-b bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex justify-between items-center h-16 px-4">
        {/* Logo */}
        <button
          className="text-xl md:text-2xl font-bold tracking-tight"
          onClick={() => router.push("/")}
        >
          Atomic <span className="text-blue-600">Habits</span>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navList.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-gray-600 hover:text-black text-sm font-medium transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Desktop User Section */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => router.push("/dashboard/profile")}
              >
                <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  {getInitials(user.username || "U")}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {user.username}
                </span>
              </div>
              <Button
                variant="outline"
                className="px-4 py-2 rounded-xl"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <Button
              className="px-5 py-2 rounded-xl"
              onClick={() => router.push("/auth")}
            >
              Get Started
            </Button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-gray-700"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden flex flex-col items-center gap-4 pb-4 border-t bg-white">
          {navList.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-gray-600 hover:text-black text-sm font-medium transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {item.name}
            </Link>
          ))}

          {user ? (
            <>
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => {
                  setMobileOpen(false);
                  router.push("/dashboard/profile");
                }}
              >
                <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  {getInitials(user.username || "U")}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {user.username}
                </span>
              </div>
              <Button
                variant="outline"
                className="px-4 py-2 rounded-xl"
                onClick={() => {
                  setMobileOpen(false);
                  handleSignOut();
                }}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <Button
              className="px-5 py-2 rounded-xl"
              onClick={() => {
                setMobileOpen(false);
                router.push("/auth");
              }}
            >
              Get Started
            </Button>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
