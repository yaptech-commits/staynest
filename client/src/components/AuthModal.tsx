import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { registerAuthModalOpener } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandImage } from "@/components/BrandImage";
import { STAYNEST_LOGO_ALT } from "@/brand";
import { isValidAuthEmail, normalizeAuthEmail } from "@/lib/authValidation";
import { toast } from "sonner";
import { X, Lock, Mail, User, ShieldCheck, ArrowRight } from "lucide-react";

export function AuthModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.localLogin.useMutation({
    onSuccess: async () => {
      toast.success("Welcome back to StayNest!");
      setIsOpen(false);
      await utils.auth.me.invalidate();
      window.location.reload();
    },
    onError: err => {
      toast.error(err.message || "Sign in failed");
    },
  });

  const registerMutation = trpc.auth.localRegister.useMutation({
    onSuccess: async () => {
      toast.success("StayNest account created successfully!");
      setIsOpen(false);
      await utils.auth.me.invalidate();
      window.location.reload();
    },
    onError: err => {
      toast.error(err.message || "Registration failed");
    },
  });

  useEffect(() => {
    registerAuthModalOpener(() => setIsOpen(true));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = normalizeAuthEmail(email);
    if (!normalizedEmail || !password.trim()) {
      toast.error("Please enter both email and password");
      return;
    }
    if (!isValidAuthEmail(normalizedEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (isRegister) {
      if (!name.trim()) {
        toast.error("Please enter your name");
        return;
      }
      registerMutation.mutate({
        email: normalizedEmail,
        password,
        name: name.trim(),
      });
    } else {
      loginMutation.mutate({ email: normalizedEmail, password });
    }
  };

  if (!isOpen) return null;

  const isPending = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-[28px] bg-white p-8 shadow-2xl">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full bg-[#f3f5f0] text-[#50605a] hover:bg-[#e8efe7]"
        >
          <X size={18} />
        </button>

        <div className="text-center">
          <div className="inline-flex rounded-xl bg-[#f7f5f0] p-2 mb-2">
            <BrandImage
              alt={STAYNEST_LOGO_ALT}
              className="h-8 w-auto max-w-[150px] object-contain"
            />
          </div>
          <h2 className="font-serif text-[28px] text-[#183a31]">
            {isRegister ? "Create your StayNest account" : "Welcome back"}
          </h2>
          <p className="mt-1.5 text-xs text-[#718078]">
            {isRegister
              ? "Join to book thoughtful stays across Ghana with live availability."
              : "Sign in to manage your bookings, stays, and partner workspace."}
          </p>
        </div>

        <form noValidate onSubmit={handleSubmit} className="mt-7 space-y-4">
          {isRegister && (
            <div className="space-y-1.5 text-left">
              <Label className="text-xs font-bold text-[#50605a]">
                Full name
              </Label>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-3.5 top-3.5 text-[#8a9890]"
                />
                <Input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Wisdom Asaare"
                  className="h-11 rounded-xl border-[#dfe4dc] pl-10 text-sm"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5 text-left">
            <Label className="text-xs font-bold text-[#50605a]">
              Email address
            </Label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3.5 top-3.5 text-[#8a9890]"
              />
              <Input
                type="text"
                inputMode="email"
                autoComplete="email"
                name="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-11 rounded-xl border-[#dfe4dc] pl-10 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <Label className="text-xs font-bold text-[#50605a]">Password</Label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3.5 top-3.5 text-[#8a9890]"
              />
              <Input
                type="password"
                autoComplete={isRegister ? "new-password" : "current-password"}
                name="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={isRegister ? "At least 6 characters" : "••••••••"}
                className="h-11 rounded-xl border-[#dfe4dc] pl-10 text-sm"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="mt-2 h-12 w-full rounded-xl bg-[#183a31] text-sm font-bold text-white hover:bg-[#245448]"
          >
            {isPending
              ? "Please wait…"
              : isRegister
                ? "Create account"
                : "Sign in to StayNest"}{" "}
            <ArrowRight size={15} className="ml-2" />
          </Button>
        </form>

        <div className="mt-6 border-t border-[#edf0eb] pt-5 text-center text-xs text-[#718078]">
          {isRegister ? (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setIsRegister(false)}
                className="font-bold text-[#2b6755] hover:underline"
              >
                Sign in
              </button>
            </p>
          ) : (
            <p>
              Don't have a StayNest account?{" "}
              <button
                type="button"
                onClick={() => setIsRegister(true)}
                className="font-bold text-[#2b6755] hover:underline"
              >
                Create account
              </button>
            </p>
          )}
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-[#8a9890]">
          <ShieldCheck size={14} className="text-[#2b6755]" /> Secure StayNest
          native authentication
        </div>
      </div>
    </div>
  );
}
