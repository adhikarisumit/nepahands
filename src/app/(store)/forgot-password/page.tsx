import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return <AuthForm mode="forgot" />;
}
