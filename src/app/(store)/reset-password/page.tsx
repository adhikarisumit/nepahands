import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Set new password" };

export default function ResetPasswordPage() {
  return <AuthForm mode="reset" />;
}
