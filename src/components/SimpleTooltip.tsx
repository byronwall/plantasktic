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
  contentProps?: React.ComponentProps<typeof TooltipContent>;
}

export function SimpleTooltip({
  content,
  children,
  className,
  contentProps,
}: SimpleTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent className={className} {...contentProps}>
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
