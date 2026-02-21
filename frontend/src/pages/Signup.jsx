import { SignUp } from "@clerk/clerk-react";
import logo from "/subzero_logo_icon.png";

export default function Signup() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#edf6ff] py-2">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-14 left-8 h-44 w-44 rounded-full bg-[#9de6ff]/45 blur-3xl" />
        <div className="absolute bottom-8 right-8 h-48 w-48 rounded-full bg-[#c9ffe3]/45 blur-3xl" />
        <img
          src="/mascot-subzro/mascotsitsmile2.webp"
          alt=""
          className="mascot-bob absolute left-8 top-24 hidden h-24 w-24 opacity-50 md:block"
        />
      </div>
      <img src={logo} alt="Logo" className="absolute top-10 z-10 w-10" />
      <h2 className="mb-6 text-2xl font-semibold text-gray-700">Welcome to SubZero</h2>
      {/* Customization of Clerk Components: https://clerk.com/docs/components/customization/overview#using-tailwind */}
      <SignUp
        forceRedirectUrl="/onboarding"
        fallbackRedirectUrl="/onboarding"
        signInUrl="/login"
        appearance={{
          elements: {
            formButtonPrimary: "bg-black text-white shadow-lg hover:bg-red-500",
          },
        }}
      />
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500 absolute inset-x-0 bottom-10">
          <a href="/impressum" className="underline">Impressum</a>, <a href="/terms" className="underline">Terms of Use</a>, <a href="/privacy" className="underline">Privacy Policy</a>, and <a href="/refund" className="underline">Refund Policy</a>.
        </p>
      </div>
    </div>
  );
}
