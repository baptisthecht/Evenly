import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Créer un compte — Evoly",
};

export default function RegisterPage() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">
        Créer un compte
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Déjà un compte ?{" "}
        <a href="/login" className="text-violet-600 hover:underline font-medium">
          Se connecter
        </a>
      </p>
      <RegisterForm />
    </div>
  );
}
