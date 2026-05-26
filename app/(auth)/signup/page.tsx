import { signUp } from "@/app/(auth)/actions";
import { AuthForm } from "@/components/auth/auth-form";
import { SiteHeader } from "@/components/shell/site-header";

export default function SignupPage() {
  return (
    <main>
      <SiteHeader />
      <AuthForm mode="signup" action={signUp} />
    </main>
  );
}
