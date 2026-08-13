import { FormEvent, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, ArrowRight, Building2, Check, ChevronRight, LockKeyhole, Sparkles, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { startLogin } from "@/const";
import { STAYNEST_LOGO_ALT } from "@/brand";
import { BrandImage } from "@/components/BrandImage";
import { toast } from "sonner";
import { createOnboardingIntent, type OnboardingRole } from "@shared/onboarding";

const roleOptions: Array<{
  id: OnboardingRole;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
}> = [
  {
    id: "guest",
    eyebrow: "For travellers",
    title: "I’m looking for a stay",
    description: "Save your details once, keep every booking together, and arrive with confidence.",
    bullets: ["Faster booking details", "One place for upcoming stays", "Simple cancellation support"],
  },
  {
    id: "partner",
    eyebrow: "For hotel owners",
    title: "I want to list a property",
    description: "Bring your rooms to more guests while keeping operations clear and conflicts visible.",
    bullets: ["BillFlow-connected inventory", "Partner dashboard access", "Admin review before publishing"],
  },
];

export default function Onboarding() {
  const [, navigate] = useLocation();
  const requestedRole = useMemo<OnboardingRole>(() => {
    const role = new URLSearchParams(window.location.search).get("role");
    return role === "partner" ? "partner" : "guest";
  }, []);
  const [role, setRole] = useState<OnboardingRole>(requestedRole);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!acceptedTerms) {
      toast.error("Please accept the StayNest terms to continue.");
      return;
    }

    try {
      const intent = createOnboardingIntent({ role, fullName, email, businessName });
      window.localStorage.setItem("staynest_onboarding_intent", JSON.stringify(intent));
      setIsSubmitting(true);
      startLogin();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Please check your details and try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f5f0] text-[#18231f]">
      <header className="border-b border-[#dfe4dc] bg-[#fbfaf7]">
        <div className="mx-auto flex h-[76px] max-w-[1240px] items-center justify-between gap-4 px-5 lg:px-8">
          <Link href="/" className="min-w-0 flex-1 items-center gap-3">
            <BrandImage alt={STAYNEST_LOGO_ALT} className="h-8 w-auto max-w-[150px] object-contain sm:h-9 sm:max-w-[190px]" />
          </Link>
          <button type="button" onClick={() => startLogin()} className="shrink-0 text-right text-[11px] font-semibold leading-4 text-[#50605a] transition hover:text-[#183a31] sm:text-sm"><span className="hidden sm:inline">Already have an account? </span><span className="text-[#183a31]">Sign in</span></button>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1240px] gap-10 px-5 py-10 lg:grid-cols-[.78fr_1.22fr] lg:items-start lg:px-8 lg:py-16">
        <section className="relative overflow-hidden rounded-[30px] bg-[#183a31] px-7 py-8 text-white sm:px-10 sm:py-11 lg:sticky lg:top-8">
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full border border-[#e7c77b]/30" />
          <div className="absolute -bottom-24 -left-20 h-56 w-56 rounded-full border border-[#9cb3a5]/25" />
          <div className="relative">
            <div className="mb-12 inline-flex items-center gap-2 rounded-full border border-[#6c8c77]/60 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#e7c77b]"><Sparkles size={13} /> Welcome to StayNest</div>
            <h1 className="max-w-[440px] font-serif text-[clamp(3rem,7vw,5.2rem)] leading-[.91] tracking-[-.045em]">Make room for a better arrival.</h1>
            <p className="mt-6 max-w-[410px] text-[15px] leading-7 text-[#c9d8cc]">Create your StayNest profile and keep the important parts of every stay close at hand.</p>
            <div className="mt-10 grid gap-4 border-t border-white/15 pt-7 text-sm text-[#d8e4d9]">
              <div className="flex items-start gap-3"><span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#e7c77b] text-[#183a31]"><Check size={14} strokeWidth={3} /></span><span><strong className="font-semibold text-white">One considered account.</strong><br />Your booking details, preferences, and support in one place.</span></div>
              <div className="flex items-start gap-3"><span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#e7c77b] text-[#183a31]"><Check size={14} strokeWidth={3} /></span><span><strong className="font-semibold text-white">Live by design.</strong><br />Connected hotel inventory stays in sync with BillFlow.</span></div>
              <div className="flex items-start gap-3"><span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#e7c77b] text-[#183a31]"><Check size={14} strokeWidth={3} /></span><span><strong className="font-semibold text-white">Human when it matters.</strong><br />A clear path to help before, during, and after your stay.</span></div>
            </div>
          </div>
        </section>

        <section className="rounded-[30px] border border-[#dfe4dc] bg-white p-6 shadow-[0_18px_70px_rgba(24,58,49,.08)] sm:p-9 lg:p-11">
          <div className="mb-9 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.16em] text-[#8a9890]"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#eef3ec] text-[#183a31]">1</span> Set up your profile <ChevronRight size={14} /><span className="text-[#b7c1b9]">2 Secure sign-in</span></div>
          <div className="mb-8 max-w-[560px]"><p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#b18143]">Your place to begin</p><h2 className="font-serif text-[clamp(2.4rem,5vw,4rem)] leading-[.95] tracking-[-.04em] text-[#183a31]">Who are you joining as?</h2><p className="mt-4 text-sm leading-6 text-[#718078]">Choose the experience that best fits you. You can update your details with the StayNest team later.</p></div>

          <div className="mb-9 grid gap-3 sm:grid-cols-2">
            {roleOptions.map((option) => {
              const active = role === option.id;
              return <button key={option.id} type="button" onClick={() => setRole(option.id)} className={`group rounded-[22px] border p-5 text-left transition ${active ? "border-[#183a31] bg-[#eff4ed] shadow-[0_10px_30px_rgba(24,58,49,.08)]" : "border-[#dfe4dc] bg-[#fbfaf7] hover:border-[#9cb3a5]"}`}>
                <div className="mb-5 flex items-start justify-between"><span className={`grid h-11 w-11 place-items-center rounded-2xl ${active ? "bg-[#183a31] text-[#e7c77b]" : "bg-[#e9eee8] text-[#50605a]"}`}>{option.id === "guest" ? <UserRound size={19} /> : <Building2 size={19} />}</span><span className={`grid h-6 w-6 place-items-center rounded-full border ${active ? "border-[#183a31] bg-[#183a31] text-white" : "border-[#cbd5cd] text-transparent"}`}><Check size={13} strokeWidth={3} /></span></div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#b18143]">{option.eyebrow}</p><h3 className="mt-2 font-serif text-[22px] leading-tight text-[#183a31]">{option.title}</h3><p className="mt-2 text-xs leading-5 text-[#718078]">{option.description}</p><div className="mt-4 space-y-1.5 text-[11px] font-semibold text-[#50605a]">{option.bullets.map((bullet) => <div key={bullet} className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-[#c9954a]" />{bullet}</div>)}</div>
              </button>;
            })}
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="full-name" className="text-xs font-bold text-[#50605a]">Full name</Label><Input id="full-name" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Ama Mensah" autoComplete="name" className="h-12 rounded-xl border-[#dfe4dc] bg-[#fbfaf7] px-4 shadow-none focus-visible:ring-[#8daa8b]" /></div><div className="space-y-2"><Label htmlFor="email" className="text-xs font-bold text-[#50605a]">Email address</Label><Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ama@example.com" autoComplete="email" className="h-12 rounded-xl border-[#dfe4dc] bg-[#fbfaf7] px-4 shadow-none focus-visible:ring-[#8daa8b]" /></div></div>
            {role === "partner" && <div className="space-y-2"><Label htmlFor="business-name" className="text-xs font-bold text-[#50605a]">Hotel or business name</Label><Input id="business-name" value={businessName} onChange={(event) => setBusinessName(event.target.value)} placeholder="Akwaba House" autoComplete="organization" className="h-12 rounded-xl border-[#dfe4dc] bg-[#fbfaf7] px-4 shadow-none focus-visible:ring-[#8daa8b]" /><p className="text-xs leading-5 text-[#8a9890]">We’ll use this to prepare your partner workspace. A StayNest admin reviews new properties before they go live.</p></div>}
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#e7ebe5] bg-[#fbfaf7] p-4"><input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#183a31]" /><span className="text-xs leading-5 text-[#718078]">I agree to StayNest’s <a href="#terms" className="font-semibold text-[#183a31] underline decoration-[#c9954a] underline-offset-2">terms</a> and understand that my details will be used to create my account.</span></label>
            <Button type="submit" disabled={isSubmitting} className="h-13 w-full rounded-xl bg-[#183a31] text-sm font-bold text-white shadow-[0_12px_24px_rgba(24,58,49,.18)] hover:bg-[#245448]">{isSubmitting ? "Opening secure sign-in…" : "Continue to secure sign-in"} {isSubmitting ? <LockKeyhole size={16} /> : <ArrowRight size={16} />}</Button>
            <p className="flex items-center justify-center gap-2 text-center text-[11px] text-[#8a9890]"><LockKeyhole size={13} /> StayNest uses secure sign-in. We never store your password.</p>
          </form>

          <div className="mt-8 flex items-center justify-between border-t border-[#edf0eb] pt-6 text-xs"><Link href="/" className="flex items-center gap-2 font-semibold text-[#718078] hover:text-[#183a31]"><ArrowLeft size={14} /> Back to stays</Link><span className="text-[#a5b1a8]">Already registered? <button type="button" onClick={() => startLogin()} className="font-semibold text-[#183a31]">Sign in</button></span></div>
        </section>
      </main>
    </div>
  );
}
