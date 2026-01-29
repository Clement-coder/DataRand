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
    <Card className="group relative overflow-hidden border-border/50 bg-card hover:border-primary/30 transition-all duration-300 hover:shadow-glow h-full flex flex-col">
      {/* Decorative corner */}
      <CornerAccent position="top-right" className="opacity-0 group-hover:opacity-20 transition-opacity" />
      
      {/* Priority indicator - lion claw marks */}
      {task.priority > 1 && (
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex gap-0.5">
          <div className="w-0.5 h-4 sm:w-1 sm:h-6 bg-primary rounded-full transform -rotate-12" />
          <div className="w-0.5 h-4 sm:w-1 sm:h-6 bg-primary rounded-full" />
          <div className="w-0.5 h-4 sm:w-1 sm:h-6 bg-primary rounded-full transform rotate-12" />
        </div>
      )}

      <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <Badge variant="outline" className={`${colorClass} font-medium gap-1 sm:gap-1.5 text-xs`}>
            <Icon size={12} className="sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">{task.task_type?.description || taskTypeName.replace("_", " ")}</span>
            <span className="sm:hidden">{(task.task_type?.description || taskTypeName.replace("_", " ")).split(" ")[0]}</span>
          </Badge>
          <span className="text-[10px] sm:text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0 flex-1">
        <h3 className="font-semibold text-base sm:text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {task.title}
        </h3>

        {task.description && (
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-3 sm:gap-5 pt-1 sm:pt-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-primary/10">
              <EarningsIcon size={14} className="sm:w-[18px] sm:h-[18px] text-primary" />
            </div>
            <span className="font-bold text-base sm:text-lg text-primary">
              ${task.payout_amount.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
            <ClockIcon size={14} className="sm:w-4 sm:h-4" />
            <span>~{task.estimated_time_minutes}m</span>
          </div>
        </div>
      </CardContent>

      {showAccept && onAccept && (
        <CardFooter className="pt-0 p-3 sm:p-6">
          <Button
            onClick={onAccept}
            className="w-full h-9 sm:h-11 gradient-primary text-primary-foreground font-semibold group/btn text-sm sm:text-base"
          >
            <span className="hidden sm:inline">Accept Challenge</span>
            <span className="sm:hidden">Accept</span>
            <ArrowRightIcon size={16} className="sm:w-[18px] sm:h-[18px] ml-1 sm:ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
