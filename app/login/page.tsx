import type { Metadata } from "next";
import { LoginForm } from "@/component/login-form";

export const metadata: Metadata = {
  title: "Login | BSI Hajj Online",
};

export default function LoginPage() {
  return <LoginForm />;
}
