import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const progressIndicatorVariants = cva(
  "flex items-center gap-2 rounded-md p-3 text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-muted text-foreground",
        success: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
        error: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface ProgressIndicatorProps extends VariantProps<typeof progressIndicatorVariants> {
  status: "uploading" | "processing" | "completed" | "error";
  progress?: number;
  message?: string;
  className?: string;
}

export function ProgressIndicator({
  status,
  progress = 0,
  message,
  variant,
  className,
}: ProgressIndicatorProps) {
  const statusConfig = {
    uploading: {
      icon: <Loader2 className="h-5 w-5 animate-spin" />,
      defaultMessage: "Uploading document...",
      variant: "default" as const,
    },
    processing: {
      icon: <Loader2 className="h-5 w-5 animate-spin" />,
      defaultMessage: "Processing document...",
      variant: "default" as const,
    },
    completed: {
      icon: <CheckCircle className="h-5 w-5" />,
      defaultMessage: "Processing completed",
      variant: "success" as const,
    },
    error: {
      icon: <AlertCircle className="h-5 w-5" />,
      defaultMessage: "An error occurred",
      variant: "error" as const,
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={cn(
        progressIndicatorVariants({
          variant: variant || config.variant,
          className,
        })
      )}
    >
      {config.icon}
      <div className="flex-1">
        <p>{message || config.defaultMessage}</p>
        {(status === "uploading" || status === "processing") && progress > 0 && (
          <div className="mt-2 h-1.5 w-full rounded-full bg-muted-foreground/20">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300 ease-in-out"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
