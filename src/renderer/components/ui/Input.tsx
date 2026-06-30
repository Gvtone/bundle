import { cn } from "@/renderer/utils/utils";
import { cva, VariantProps } from "class-variance-authority";

const inputVariants = cva(
  "w-fit inline-flex items-center rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed whitespace-nowrap",
  {
    variants: {
      variant: {
        primary: ["bg-card-muted border border-border"],
        secondary: ["bg-card border border-border"],
        muted: ["bg-card-muted"]
      },
      scale: {
        sm: "px-4 py-1 text-sm",
        md: "px-5 py-2.5 text-sm",
        lg: "px-6 py-3 text-base"
      },
      fullWidth: {
        true: "w-full"
      }
    },
    defaultVariants: {
      variant: "primary",
      scale: "md"
    }
  }
);

interface InputProps
  extends
    React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {}

function Input({
  className,
  variant,
  scale,
  fullWidth,
  type = "text",
  ...props
}: InputProps) {
  return (
    <input
      type={type}
      className={cn(inputVariants({ variant, scale, fullWidth }), className)}
      {...props}
    />
  );
}

export default Input;
