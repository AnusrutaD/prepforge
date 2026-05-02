import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex items-center justify-center min-h-screen">
      <div className="space-y-6 text-center">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Prep<span className="text-indigo-400">Forge</span>
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Start your adaptive prep journey
          </p>
        </div>
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-gray-900 border border-gray-800 shadow-xl",
              headerTitle: "text-white",
              headerSubtitle: "text-gray-400",
              socialButtonsBlockButton:
                "bg-gray-800 border border-gray-700 text-white hover:bg-gray-700",
              dividerLine: "bg-gray-700",
              dividerText: "text-gray-500",
              formFieldLabel: "text-gray-300",
              formFieldInput:
                "bg-gray-800 border-gray-700 text-white focus:border-indigo-500",
              formButtonPrimary:
                "bg-indigo-600 hover:bg-indigo-500 text-white",
              footerActionLink: "text-indigo-400 hover:text-indigo-300",
            },
          }}
        />
      </div>
    </main>
  );
}
