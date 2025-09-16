"use client"

import React, { useState, useEffect } from "react";
import { Github, Instagram, Linkedin, X } from "lucide-react";

const Footer = () => {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const timeString = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).replace(" ", "");
      setCurrentTime(timeString);
    };

    updateTime();
    const timerId = setInterval(updateTime, 60000);

    return () => clearInterval(timerId);
  }, []);

  const socialLinks = [
    { icon: Github, href: "https://github.com/RitochitGhosh", label: "GitHub" },
    { icon: Linkedin, href: "https://www.linkedin.com/in/ritochit-ghosh-3861372a0/", label: "LinkedIn" },
    { icon: X, href: "https://x.com/18Ritochit", label: "Twitter" },
    { icon: Instagram, href: "https://www.instagram.com/_ritochit.ghosh_/", label: "Instagram" },
  ];

  return (
    <footer className="bg-black text-white py-10 px-6 md:px-12 rounded-t-3xl md:rounded-t-4xl pt-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-xl font-bold">Atomic Habits</h3>
            <p className="text-sm text-gray-400 mt-2">
              Take-home assignment from{" "}
              <a
                href="https://exp.club"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-blue-400 hover:text-blue-400 transition-colors"
              >
                exp.club
              </a>
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 md:gap-10 text-sm text-gray-400">
            <a href="#" className="hover:text-white transition-colors">
              Terms & Conditions
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
          </div>

          <div className="text-sm text-gray-500">
            © {new Date().getFullYear()} — All rights reserved
          </div>
        </div>

        <div className="mt-4 flex flex-col-reverse md:flex-row justify-between items-center gap-6">
          <div className="text-sm text-gray-400">
            Developed by{" "}
            <span className="font-semibold text-white">Ritochit Ghosh</span>
          </div>

          <div className="flex items-center gap-5">
            {socialLinks.map((link, index) => (
              <a
                key={index}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.label}
                className="text-gray-400 hover:text-white transition-transform hover:scale-110"
              >
                <link.icon size={20} />
              </a>
            ))}
          </div>

          <div className="text-sm font-mono text-gray-500">{currentTime}</div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;