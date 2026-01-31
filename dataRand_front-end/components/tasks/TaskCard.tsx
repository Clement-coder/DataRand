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
    <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-card/80 to-card backdrop-blur-sm hover:from-card hover:to-card/90 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 h-full flex flex-col">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Priority indicator */}
      {task.priority > 1 && (
        <div className="absolute top-3 right-3 flex gap-1">
          {[...Array(Math.min(task.priority, 3))].map((_, i) => (
            <div key={i} className="w-1 h-6 bg-gradient-to-b from-primary to-primary/60 rounded-full transform rotate-12 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
          ))}
        </div>
      )}

      <CardHeader className="pb-3 p-6 relative z-10">
        <div className="flex items-start justify-between gap-3">
          <Badge variant="outline" className={`${colorClass} font-medium gap-2 px-3 py-1 rounded-full border-0 shadow-sm`}>
            <Icon size={14} />
            <span className="hidden sm:inline">{task.task_type?.description || taskTypeName.replace("_", " ")}</span>
            <span className="sm:hidden">{(task.task_type?.description || taskTypeName.replace("_", " ")).split(" ")[0]}</span>
          </Badge>
          <span className="text-xs text-muted-foreground/80 font-medium">
            {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-6 pt-0 flex-1 relative z-10">
        <h3 className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-300">
          {task.title}
        </h3>

        {task.description && (
          <p className="text-sm text-muted-foreground/90 line-clamp-3 leading-relaxed">
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 group-hover:from-primary/30 group-hover:to-primary/20 transition-all duration-300">
              <EarningsIcon size={18} className="text-primary" />
            </div>
            <div>
              <span className="font-bold text-xl text-primary">
                ${task.payout_amount.toFixed(2)}
              </span>
              <p className="text-xs text-muted-foreground/70">reward</p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
            <ClockIcon size={14} className="text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">~{task.estimated_time_minutes}m</span>
          </div>
        </div>
      </CardContent>

      {showAccept && onAccept && (
        <CardFooter className="pt-0 p-6 relative z-10">
          <Button
            onClick={onAccept}
            className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-bold group/btn text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <span className="hidden sm:inline">Accept Challenge</span>
            <span className="sm:hidden">Accept</span>
            <ArrowRightIcon size={18} className="ml-2 group-hover/btn:translate-x-1 transition-transform duration-300" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
