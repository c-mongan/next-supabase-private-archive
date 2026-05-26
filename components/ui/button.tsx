import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: false;
  variant?: "primary" | "secondary" | "ghost";
};

type LinkButtonProps = React.ComponentProps<typeof Link> & {
  asChild: true;
  variant?: "primary" | "secondary" | "ghost";
};

const variants = {
  primary: "bg-teal-700 text-white hover:bg-teal-800",
  secondary: "border border-slate-300 bg-white text-slate-950 hover:bg-slate-50",
  ghost: "text-slate-700 hover:bg-slate-100",
};

export function Button(props: ButtonProps | LinkButtonProps) {
  const variant = props.variant ?? "primary";
  const className = cn(
    "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition",
    variants[variant],
    props.className,
  );

  if (props.asChild) {
    const { asChild, variant: _variant, ...linkProps } = props;
    void asChild;
    void _variant;
    return <Link {...linkProps} className={className} />;
  }

  const { asChild, variant: _variant, ...buttonProps } = props;
  void asChild;
  void _variant;
  return <button {...buttonProps} className={className} />;
}
