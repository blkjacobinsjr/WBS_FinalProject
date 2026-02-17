import { SignUp } from "@clerk/clerk-react";
import logo from '/subzero_logo_icon.png'; // Moved the logo to the src folder

export default function Signup() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 py-2">
      <img src={logo} alt="Logo" className="absolute  top-10 w-10" />
      <h2 className="text-2xl font-semibold text-gray-700 mb-6">Welcome to SubZero</h2>
      {/* Customization of Clerk Components: https://clerk.com/docs/components/customization/overview#using-tailwind */}
      <SignUp
        appearance={{
          elements: {
            formButtonPrimary: "bg-black text-white shadow-lg hover:bg-red-500",
          },
        }}
      />
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500 absolute inset-x-0 bottom-10">
           <a href="/terms" className="underline">Terms of Use</a>, <a href="/privacy" className="underline">Privacy Policy</a>, and <a href="/refund" className="underline">Refund Policy</a>.
        </p>
      </div>
    </div>
  );
}
