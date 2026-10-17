import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "",
        className
      )}
    >
      {eyebrow ? (
        <span className="mb-3 inline-block rounded-full bg-fresh/10 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.16em] text-fresh dark:bg-fresh/20 dark:text-fresh">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="text-2xl font-extrabold tracking-tight text-primary dark:text-foreground sm:text-3xl md:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3.5 text-sm sm:text-base leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}
