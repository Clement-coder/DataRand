import { TaskType } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  ImageLabelIcon,
  AudioIcon,
  AIIcon,
  TaskIcon,
} from "@/components/icons/DataRandIcons";

const taskTypeIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  image_labeling: ImageLabelIcon,
  audio_transcription: AudioIcon,
  ai_evaluation: AIIcon,
};

type TaskFiltersProps = {
  taskTypes: TaskType[];
  selectedType: string | null;
  onSelectType: (typeId: string | null) => void;
};

export function TaskFilters({
  taskTypes,
  selectedType,
  onSelectType,
}: TaskFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
      <Button
        variant={selectedType === null ? "default" : "outline"}
        size="sm"
        onClick={() => onSelectType(null)}
        className={`${selectedType === null ? "gradient-primary text-primary-foreground" : ""} flex-shrink-0`}
      >
        <TaskIcon size={16} className="mr-1.5" />
        All Tasks
      </Button>

      {taskTypes.map((type) => {
        const Icon = taskTypeIcons[type.name] || AIIcon;
        const isSelected = selectedType === type.id;

        return (
          <Button
            key={type.id}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={() => onSelectType(type.id)}
            className={`${isSelected ? "gradient-primary text-primary-foreground" : ""} flex-shrink-0`}
          >
            <Icon size={16} className="mr-1.5" />
            <span className="hidden sm:inline">
              {type.name.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </span>
            <span className="sm:hidden">
              {type.name.split("_")[0].replace(/\b\w/g, (l) => l.toUpperCase())}
            </span>
          </Button>
        );
      })}
    </div>
  );
}
