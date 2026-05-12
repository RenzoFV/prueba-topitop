import { cn } from "@/lib/utils";

export function Logo({
  className,
  size = 36,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <img
      src="/Topitop_2007.webp"
      alt="Topitop"
      height={size}
      className={cn("w-auto select-none", className)}
      style={{ height: size }}
      draggable={false}
    />
  );
}
