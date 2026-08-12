import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { STAYNEST_LOGO_ALT } from "@/brand";
import { BrandImage } from "@/components/BrandImage";
import { ArrowRight, CheckCircle2, Clock3, LockKeyhole, MailCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

type VerificationState = "checking" | "verified" | "invalid" | "missing" | "error";

export default function EmailVerification() {
  const [state, setState] = useState<VerificationState>("checking");
  const started = useRef(false);
  const verify = trpc.auth.verifyEmail.useMutation();

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setState("missing");
      return;
    }
    verify.mutate({ token }, {
      onSuccess: (verified) => setState(verified ? "verified" : "invalid"),
      onError: () => setState("error"),
    });
  }, [verify]);

  const content = {
    checking: { icon: <Clock3 size={27} />, eyebrow: "Checking your link", title: "One moment, please.", copy: "We’re confirming your StayNest email link securely." },
    verified: { icon: <CheckCircle2 size={27} />, eyebrow: "Email verified", title: "You’re all set.", copy: "Your email is verified. You can now continue with bookings and partner updates." },
    invalid: { icon: <XCircle size={27} />, eyebrow: "Link expired", title: "This link needs a fresh start.", copy: "Verification links expire after 24 hours. Return to onboarding to request a new welcome email." },
    missing: { icon: <MailCheck size={27} />, eyebrow: "Verification link missing", title: "We couldn’t find the link.", copy: "Open the verification button from your StayNest welcome email, or return to your account." },
    error: { icon: <XCircle size={27} />, eyebrow: "Something went wrong", title: "We couldn’t verify that link.", copy: "Please try again from the email or contact StayNest support if the issue continues." },
  }[state];

  return (
    <div className="min-h-screen bg-[#f7f5f0] text-[#18231f]">
      <header className="border-b border-[#dfe4dc] bg-[#fbfaf7]">
        <div className="mx-auto flex h-[76px] max-w-[1240px] items-center justify-between px-5 lg:px-8">
          <Link href="/" className="flex items-center"><BrandImage alt={STAYNEST_LOGO_ALT} className="h-8 w-auto max-w-[170px] object-contain sm:h-9 sm:max-w-[190px]" /></Link>
          <span className="flex items-center gap-2 text-xs font-semibold text-[#718078]"><LockKeyhole size={14} className="text-[#2b6755]" /> Secure account access</span>
        </div>
      </header>
      <main className="mx-auto flex max-w-[720px] items-center justify-center px-5 py-20 lg:py-28">
        <section className="w-full rounded-[30px] border border-[#dfe4dc] bg-white p-7 text-center shadow-[0_18px_70px_rgba(24,58,49,.08)] sm:p-12">
          <div className={`mx-auto grid h-16 w-16 place-items-center rounded-2xl ${state === "verified" ? "bg-[#e8efe7] text-[#2b6755]" : state === "checking" ? "bg-[#f4f0e3] text-[#b18143]" : "bg-[#fff1e7] text-[#a35c29]"}`}>{content.icon}</div>
          <p className="mt-7 text-[11px] font-bold uppercase tracking-[0.18em] text-[#b18143]">{content.eyebrow}</p>
          <h1 className="mt-3 font-serif text-[clamp(2.6rem,7vw,4.5rem)] leading-[.95] tracking-[-.04em] text-[#183a31]">{content.title}</h1>
          <p className="mx-auto mt-5 max-w-[460px] text-sm leading-6 text-[#718078]">{content.copy}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href={state === "verified" ? "/account" : "/onboarding"}><Button className="h-11 rounded-xl bg-[#183a31] px-5 text-sm font-bold text-white hover:bg-[#245448]">{state === "verified" ? "Go to my account" : "Return to onboarding"} <ArrowRight size={15} /></Button></Link>
            <Link href="/"><Button variant="outline" className="h-11 rounded-xl border-[#dfe4dc] px-5 text-sm font-bold text-[#183a31]">Explore stays</Button></Link>
          </div>
        </section>
      </main>
    </div>
  );
}

export type { VerificationState };
