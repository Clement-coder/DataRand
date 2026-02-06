// Task Expiration Checker Hook
// Periodically checks and handles expired tasks

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function useTaskExpiration() {
  useEffect(() => {
    const checkExpiredTasks = async () => {
      try {
        await supabase.rpc("handle_expired_tasks");
      } catch (error) {
        console.error("Error checking expired tasks:", error);
      }
    };

    // Check immediately on mount
    checkExpiredTasks();

    // Check every 5 minutes
    const interval = setInterval(checkExpiredTasks, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);
}
