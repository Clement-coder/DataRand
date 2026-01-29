"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase, type Task, type TaskType } from "@/lib/supabase";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskFilters } from "@/components/tasks/TaskFilters";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { GeometricBackground } from "@/components/ui/GeometricBackground";
import withAuth from "@/components/withAuth";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

import { TaskSeeder } from "@/components/dev/TaskSeeder";

import {
  RefreshIcon,
  PowerIcon,
  SearchIcon,
  TaskIcon,
} from "@/components/icons/DataRandIcons";
import { testSupabaseConnection, checkTasksTable } from "@/lib/supabase-test";

function Tasks() {
  const { profile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Use useCallback to memoize fetchTasks and prevent infinite loops
  const fetchTasks = useCallback(async () => {
    if (!profile) {
      console.log("No profile found, skipping task fetch");
      return;
    }
    
    setLoading(true);
    try {
      console.log("Fetching tasks for profile:", profile.id);
      
      // Fetch task types first
      const { data: types, error: typesError } = await supabase
        .from("task_types")
        .select("*");
        
      if (typesError) {
        console.error("Error fetching task types:", typesError);
        toast({
          title: "Error",
          description: "Failed to load task types. Please try again.",
          variant: "destructive",
        });
      } else {
        console.log("Task types fetched successfully:", types?.length || 0);
        setTaskTypes(types as TaskType[] || []);
      }

      // Build task query
      let query = supabase
        .from("tasks")
        .select(`
          *,
          task_type:task_types(*),
          client:profiles(*)
        `)
        .eq("status", "available")
        .order("created_at", { ascending: false });

      // Apply type filter if selected
      if (selectedType) {
        query = query.eq("task_type_id", selectedType);
        console.log("Filtering by task type:", selectedType);
      }

      console.log("Executing task query...");
      const { data: tasksData, error: tasksError } = await query;

      if (tasksError) {
        console.error("Error fetching tasks:", tasksError);
        toast({
          title: "Failed to fetch tasks",
          description: `Error: ${tasksError.message}. Please check your connection and try again.`,
          variant: "destructive",
        });
        setTasks([]);
      } else {
        console.log("Tasks fetched successfully:", tasksData?.length || 0);
        setTasks((tasksData as Task[]) || []);
      }
    } catch (err) {
      console.error("Unexpected error in fetchTasks:", err);
      toast({
        title: "Connection Error",
        description: "Unable to connect to the server. Please check your internet connection.",
        variant: "destructive",
      });
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [profile, selectedType, toast]);

  // Test connection on mount
  useEffect(() => {
    const testConnection = async () => {
      const connectionTest = await testSupabaseConnection();
      if (!connectionTest.success) {
        toast({
          title: "Connection Issue",
          description: `Database connection failed: ${connectionTest.error}`,
          variant: "destructive",
        });
      }
      
      const tasksTableTest = await checkTasksTable();
      if (!tasksTableTest.success) {
        toast({
          title: "Database Issue",
          description: `Tasks table not accessible: ${tasksTableTest.error}`,
          variant: "destructive",
        });
      }
    };
    
    testConnection();
  }, [toast]);

  // Fetch tasks only once when profile loads or selectedType changes
  useEffect(() => {
    if (profile) {
      fetchTasks();
    }
  }, [profile, selectedType, fetchTasks]);

  // Real-time subscription for new tasks


useEffect(() => {
  if (!profile) return;

  const channel = supabase
    .channel("tasks-realtime")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "tasks",
        filter: "status=eq.available",
      },
      (payload: RealtimePostgresChangesPayload<Task>) => {
        const newTask = payload.new as Task; // ⬅️ force type

        toast({
          title: "🦁 New Task Available!",
          description: `"${newTask.title}" just posted.`,
        });

        fetchTasks();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [profile, fetchTasks, toast]);



  const handleAcceptTask = async (taskId: string) => {
    if (!profile) return;

    try {
      // Create assignment
      const { error: assignError } = await supabase
        .from("task_assignments")
        .insert({
          task_id: taskId,
          worker_id: profile.id,
          status: "accepted",
        });

      if (assignError) {
        if (assignError.code === "23505") {
          toast({
            title: "Already Accepted",
            description: "You've already accepted this task.",
            variant: "destructive",
          });
        } else {
          throw assignError;
        }
        return;
      }

      // Update task status
      await supabase
        .from("tasks")
        .update({ status: "assigned" })
        .eq("id", taskId);

      toast({
        title: "Challenge Accepted! 🦁",
        description: "Head to My Work to complete it.",
      });

      router.push("/my-work");
    } catch (err) {
      console.error("Error accepting task:", err);
      toast({
        title: "Error",
        description: "Failed to accept task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground">No profile found. Please sign in.</p>
          <Button onClick={() => router.push("/auth")}>Go to Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Development Tools */}
        {process.env.NODE_ENV === 'development' && <TaskSeeder />}

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <PowerIcon size={22} className="text-primary" />
              </div>
              Available Challenges
            </h1>
            <p className="text-muted-foreground mt-1">
              Accept tasks to prove your worth and earn rewards
            </p>
          </div>
          <Button
            variant="outline"
            onClick={fetchTasks}
            disabled={loading}
            className="w-fit gap-2"
          >
            <RefreshIcon size={18} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>

        {/* Debug Info (remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-muted/50 p-4 rounded-lg text-sm">
            <p><strong>Debug Info:</strong></p>
            <p>Profile ID: {profile?.id}</p>
            <p>Tasks loaded: {tasks.length}</p>
            <p>Task types loaded: {taskTypes.length}</p>
            <p>Selected type: {selectedType || 'All'}</p>
            <p>Search query: "{searchQuery}"</p>
            <p>Filtered tasks: {filteredTasks.length}</p>
          </div>
        )}

        {/* Search & Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-full sm:max-w-md">
            <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <div className="w-full sm:w-auto">
            <TaskFilters
              taskTypes={taskTypes}
              selectedType={selectedType}
              onSelectType={setSelectedType}
            />
          </div>
        </div>

        {/* Tasks Grid */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-xl" />
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="relative flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-border">
            <GeometricBackground variant="ndebele" opacity={0.03} />
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted mb-5">
              <TaskIcon size={40} className="text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No challenges available</h3>
            <p className="text-muted-foreground max-w-sm">
              The hunting grounds are quiet. Check back soon — new tasks are posted regularly.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onAccept={() => handleAcceptTask(task.id)}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default withAuth(Tasks);