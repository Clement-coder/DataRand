import { Task } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import {
  ClockIcon,
  EarningsIcon,
  ImageLabelIcon,
  AudioIcon,
  AIIcon,
  ArrowRightIcon,
} from "@/components/icons/DataRandIcons";
import { CornerAccent } from "@/components/ui/GeometricBackground";

const taskTypeIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  image_labeling: ImageLabelIcon,
  audio_transcription: AudioIcon,
  ai_evaluation: AIIcon,
};

const taskTypeColors: Record<string, string> = {
  image_labeling: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  audio_transcription: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  ai_evaluation: "bg-green-500/10 text-green-400 border-green-500/20",
};

type TaskCardProps = {
  task: Task;
  onAccept?: () => void;
  showAccept?: boolean;
};

export function TaskCard({ task, onAccept, showAccept = true }: TaskCardProps) {
  const taskTypeName = task.task_type?.name || "unknown";
  const Icon = taskTypeIcons[taskTypeName] || AIIcon;
  const colorClass = taskTypeColors[taskTypeName] || "bg-muted text-muted-foreground";

  return (
    <Card className="group relative overflow-hidden border-border/50 bg-card hover:border-primary/30 transition-all duration-300 hover:shadow-glow">
      {/* Decorative corner */}
      <CornerAccent position="top-right" className="opacity-0 group-hover:opacity-20 transition-opacity" />
      
      {/* Priority indicator - lion claw marks */}
      {task.priority > 1 && (
        <div className="absolute top-3 right-3 flex gap-0.5">
          <div className="w-1 h-6 bg-primary rounded-full transform -rotate-12" />
          <div className="w-1 h-6 bg-primary rounded-full" />
          <div className="w-1 h-6 bg-primary rounded-full transform rotate-12" />
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <Badge variant="outline" className={`${colorClass} font-medium gap-1.5`}>
            <Icon size={14} />
            {task.task_type?.description || taskTypeName.replace("_", " ")}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {task.title}
        </h3>

        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-5 pt-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <EarningsIcon size={18} className="text-primary" />
            </div>
            <span className="font-bold text-lg text-primary">
              ${task.payout_amount.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ClockIcon size={16} />
            <span>~{task.estimated_time_minutes} min</span>
          </div>
        </div>
      </CardContent>

      {showAccept && onAccept && (
        <CardFooter className="pt-0">
          <Button
            onClick={onAccept}
            className="w-full h-11 gradient-primary text-primary-foreground font-semibold group/btn"
          >
            Accept Challenge
            <ArrowRightIcon size={18} className="ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
