import { cn } from "@/renderer/utils/utils";
import { cva, VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "w-fit inline-flex items-center gap-2 rounded-lg font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed whitespace-nowrap",
  {
    variants: {
      variant: {
        primary: [
          "bg-primary text-primary-foreground",
          "hover:bg-primary-hover"
        ],
        secondary: ["bg-card-muted text-foreground"],
        tertiary: ["bg-transparent"],
        muted: ["bg-card-muted border border-border"]
      },
      size: {
        sm: "px-4 py-1 text-sm",
        md: "px-5 py-2.5 text-sm",
        lg: "px-6 py-3 text-base",
        icon: "size-6"
      },
      contentPosition: {
        start: "justify-start",
        center: "justify-center",
        end: "justify-end",
        between: "justify-between"
      },
      fullWidth: {
        true: "w-full"
      },
      active: {
        true: "bg-primary-soft"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      contentPosition: "center"
    }
  }
);

interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

function Button({
  children,
  className,
  variant,
  size,
  contentPosition,
  fullWidth,
  active,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        buttonVariants({ variant, size, contentPosition, active, fullWidth }),
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
