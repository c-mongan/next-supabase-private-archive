import Link from "next/link";
import { Button } from "@/components/ui/button";

type AuthFormProps = {
  mode: "login" | "signup";
  action: (formData: FormData) => Promise<void>;
};

export function AuthForm({ mode, action }: AuthFormProps) {
  const isLogin = mode === "login";

  return (
    <form action={action} className="mx-auto mt-16 w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-950">
        {isLogin ? "Sign in" : "Create account"}
      </h1>
      <div className="mt-6 grid gap-4">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Email
          <input
            className="h-10 rounded-md border border-slate-300 px-3 text-slate-950 outline-none focus:border-teal-700"
            name="email"
            type="email"
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Password
          <input
            className="h-10 rounded-md border border-slate-300 px-3 text-slate-950 outline-none focus:border-teal-700"
            name="password"
            type="password"
            minLength={8}
            required
          />
        </label>
      </div>
      <Button className="mt-6 w-full" type="submit">
        {isLogin ? "Sign in" : "Create account"}
      </Button>
      <p className="mt-4 text-center text-sm text-slate-600">
        {isLogin ? "Need access?" : "Already have access?"}{" "}
        <Link className="font-semibold text-teal-700" href={isLogin ? "/signup" : "/login"}>
          {isLogin ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </form>
  );
}
