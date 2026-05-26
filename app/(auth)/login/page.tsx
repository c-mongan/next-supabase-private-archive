import { signIn } from "@/app/(auth)/actions";
import { AuthForm } from "@/components/auth/auth-form";
import { SiteHeader } from "@/components/shell/site-header";

export default function LoginPage() {
  return (
    <main>
      <SiteHeader />
      <AuthForm mode="login" action={signIn} />
    </main>
  );
}
