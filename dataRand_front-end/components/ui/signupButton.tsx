"use client";

import { useEffect } from "react";
import { Button } from "./button";
import { ArrowRightIcon } from "../icons/DataRandIcons";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function SignUpButton() {
  const { user, profile, signIn } = useAuth();
  const router = useRouter();

  const handleSignUp = () => {
    signIn(); // open Privy modal
  };

  useEffect(() => {
    if (user && !profile) {
      // New user signed up, redirect immediately to tasks page
      router.push("/tasks");
    } else if (user && profile) {
      // Existing user logged in, redirect based on their role
      if (profile.role === "client") {
        router.push("/client/tasks");
      } else {
        router.push("/tasks");
      }
    }
  }, [user, profile, router]);

  return (
    <Button
      onClick={handleSignUp}
      className="w-full h-12 gradient-primary text-primary-foreground font-semibold text-base group"
    >
      Enter the Arena
      <ArrowRightIcon
        size={20}
        className="ml-2 group-hover:translate-x-1 transition-transform"
      />
    </Button>
  );
}
