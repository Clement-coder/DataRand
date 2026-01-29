import { Task, TaskType } from "@/lib/supabase";

export const mockTaskTypes: TaskType[] = [
  {
    id: "1",
    name: "image_labeling",
    description: "Image Labeling",
    icon: null,
  },
  {
    id: "2", 
    name: "audio_transcription",
    description: "Audio Transcription",
    icon: null,
  },
  {
    id: "3",
    name: "ai_evaluation", 
    description: "AI Evaluation",
    icon: null,
  },
];

export const mockTasks: Task[] = [
  {
    id: "1",
    client_id: "client1",
    task_type_id: "1",
    title: "Label Product Images",
    description: "Help us identify and label products in e-commerce images",
    instructions: "Look at each image and select the appropriate product category",
    payout_amount: 2.50,
    estimated_time_minutes: 5,
    status: "available",
    priority: 1,
    data: null,
    created_at: new Date().toISOString(),
    expires_at: null,
    worker_count: 10,
    target_countries: ["all"],
    media_url: null,
    media_type: null,
    task_type: mockTaskTypes[0],
  },
  {
    id: "2",
    client_id: "client2", 
    task_type_id: "2",
    title: "Transcribe Audio Clips",
    description: "Convert short audio recordings to text",
    instructions: "Listen carefully and type exactly what you hear",
    payout_amount: 1.75,
    estimated_time_minutes: 3,
    status: "available",
    priority: 1,
    data: null,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    expires_at: null,
    worker_count: 5,
    target_countries: ["Nigeria", "Kenya", "Ghana"],
    media_url: null,
    media_type: null,
    task_type: mockTaskTypes[1],
  },
];

export function useMockData() {
  return {
    tasks: mockTasks,
    taskTypes: mockTaskTypes,
  };
}
