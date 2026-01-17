import { createFileRoute } from '@tanstack/react-router'
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from '@clerk/clerk-react'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <header className="flex justify-between items-center p-6">
        <h1 className="text-2xl font-bold">HackTheBias</h1>
        <div>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg font-medium transition-colors">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </header>

      <main className="flex flex-col items-center justify-center px-6 py-20">
        <h2 className="text-5xl font-bold mb-6 text-center">
          Welcome to <span className="text-indigo-400">HackTheBias</span>
        </h2>
        <p className="text-xl text-slate-300 mb-8 text-center max-w-2xl">
          Built with TanStack Router, Vite, React, TailwindCSS, TypeScript, Convex, and Clerk.
        </p>

        <SignedOut>
          <p className="text-slate-400">Sign in to get started.</p>
        </SignedOut>

        <SignedIn>
          <p className="text-slate-400">You're signed in! Start building.</p>
        </SignedIn>
      </main>
    </div>
  )
}
