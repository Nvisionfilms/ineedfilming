import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectPhase {
  id: string;
  name: string;
  status: "completed" | "in_progress" | "pending";
  date?: string;
  description: string;
}

interface ProjectProgressTrackerProps {
  currentPhase: string;
  phases?: ProjectPhase[];
  projectName?: string;
}

const defaultPhases: ProjectPhase[] = [
  {
    id: "pre-production",
    name: "Pre-Production",
    status: "completed",
    description: "Story planning & logistics",
  },
  {
    id: "filming",
    name: "Filming Day",
    status: "in_progress",
    description: "Capturing your founder story",
  },
  {
    id: "editing",
    name: "Post-Production",
    status: "pending",
    description: "Editing & refinement",
  },
  {
    id: "delivery",
    name: "Final Delivery",
    status: "pending",
    description: "Your episodes are ready",
  },
];

export function ProjectProgressTracker({
  currentPhase,
  phases = defaultPhases,
  projectName,
}: ProjectProgressTrackerProps) {
  const currentIndex = phases.findIndex((p) => p.id === currentPhase);
  const progress = ((currentIndex + 1) / phases.length) * 100;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "in_progress":
        return <Clock className="w-5 h-5 text-primary animate-pulse" />;
      default:
        return <Circle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="secondary" className="bg-green-500/10 text-green-700 border-green-500/20">Complete</Badge>;
      case "in_progress":
        return <Badge className="bg-primary/10 text-primary border-primary/20">In Progress</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground">Upcoming</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Your Story Journey</CardTitle>
          {projectName && (
            <Badge variant="outline" className="text-xs">
              {projectName}
            </Badge>
          )}
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm font-medium text-primary">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {phases.map((phase, index) => (
            <div key={phase.id} className="relative">
              {/* Connector Line */}
              {index < phases.length - 1 && (
                <div
                  className={cn(
                    "absolute left-[10px] top-8 w-0.5 h-12",
                    phase.status === "completed" ? "bg-green-500" : "bg-muted"
                  )}
                />
              )}

              {/* Phase Card */}
              <div
                className={cn(
                  "flex items-start gap-4 p-4 rounded-lg border transition-all",
                  phase.status === "in_progress" && "bg-primary/5 border-primary/30",
                  phase.status === "completed" && "bg-green-500/5 border-green-500/20",
                  phase.status === "pending" && "bg-muted/30 border-muted"
                )}
              >
                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {getStatusIcon(phase.status)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{phase.name}</h4>
                    {getStatusBadge(phase.status)}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {phase.description}
                  </p>
                  {phase.date && (
                    <p className="text-xs text-muted-foreground">
                      {phase.status === "completed" ? "Completed: " : "Scheduled: "}
                      <span className="font-medium">{phase.date}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Next Steps */}
        {currentIndex < phases.length - 1 && (
          <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-sm font-medium mb-1">What's Next?</p>
            <p className="text-xs text-muted-foreground">
              {phases[currentIndex + 1]?.name} - {phases[currentIndex + 1]?.description}
            </p>
          </div>
        )}

        {/* Completion Message */}
        {currentIndex === phases.length - 1 && phases[currentIndex].status === "completed" && (
          <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-sm font-medium text-green-700 mb-1">🎉 Project Complete!</p>
            <p className="text-xs text-muted-foreground">
              Your founder story is ready to share with the world.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
