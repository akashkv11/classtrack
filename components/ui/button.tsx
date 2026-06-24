import Link from "next/link";

const variants = {
  primary: "bg-blue-600 text-white hover:bg-blue-700",
  secondary: "border border-slate-300 text-slate-700 hover:bg-slate-50",
  whatsapp: "bg-green-600 text-white hover:bg-green-700",
  danger: "bg-red-600 text-white hover:bg-red-700",
  dark: "bg-slate-900 text-white hover:bg-slate-800",
  amber: "bg-amber-900 text-white hover:bg-amber-950",
} as const;

const sizes = {
  sm: "px-3 py-1.5",
  md: "px-4 py-2",
} as const;

type ButtonVariant = keyof typeof variants;
type ButtonSize = keyof typeof sizes;

type ButtonBaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  disabled?: boolean;
};

function buttonClassName(variant: ButtonVariant, size: ButtonSize, className = "") {
  return [
    "rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
    variants[variant],
    sizes[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

type ButtonProps = ButtonBaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
  };

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClassName(variant, size, className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

type ButtonLinkProps = ButtonBaseProps &
  React.ComponentProps<typeof Link> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
  };

export function ButtonLink({
  variant = "secondary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={buttonClassName(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}

export function buttonStyles(variant: ButtonVariant = "primary", size: ButtonSize = "sm") {
  return buttonClassName(variant, size);
}
