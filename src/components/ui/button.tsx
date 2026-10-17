import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold tracking-normal transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-[#1f5a43] active:scale-[0.99]",
        gold: "bg-accent text-accent-foreground font-bold shadow-sm hover:bg-[#e7b836] hover:shadow active:scale-[0.99]",
        fresh: "bg-fresh text-fresh-foreground font-semibold shadow-sm hover:bg-[#256044] active:scale-[0.99]",
        outline: "border border-border bg-card text-foreground shadow-xs hover:bg-secondary hover:border-primary/40 hover:text-primary active:scale-[0.99]",
        ghost: "text-foreground hover:bg-secondary hover:text-primary active:scale-[0.99]",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.99]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-[#b03c2e] active:scale-[0.99]"
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-lg px-3.5 text-xs",
        lg: "h-12 rounded-xl px-7 text-base font-bold",
        icon: "h-10 w-10 p-0"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
