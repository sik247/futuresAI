import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminLoginForm from "./admin-login-form";

export const metadata = {
  title: "Admin Login - FuturesAI",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  params: { lang },
}: {
  params: { lang: string };
}) {
  const session = await auth();
  if (session?.user?.role === "ADMIN") {
    redirect(`/${lang}/dashboard/admin`);
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-24">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/[0.03] rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white">Admin Access</h1>
          <p className="text-sm text-zinc-500 mt-1">FuturesAI Administration</p>
        </div>

        <div className="rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] p-6 shadow-2xl shadow-black/40">
          <div className="absolute -top-px inset-x-6 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
          <AdminLoginForm lang={lang} />
        </div>
      </div>
    </div>
  );
}
