import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";

interface SimpleTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function SimpleTooltip({
  content,
  children,
  className,
}: SimpleTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent className={className}>{content}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
