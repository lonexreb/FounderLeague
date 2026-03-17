import Link from "next/link";
import { Trophy, Shield, Moon, Activity, ArrowRight, Users, Zap } from "lucide-react";

const features = [
  {
    icon: Trophy,
    title: "8 Leaderboard Categories",
    description: "Compete across readiness consistency, sleep quality, ACWR management, and more.",
  },
  {
    icon: Moon,
    title: "Recovery Over Hustle",
    description: "Earn points for rest days, sleep consistency, and deload discipline.",
  },
  {
    icon: Activity,
    title: "Wearable Integration",
    description: "Connect your Oura Ring or Whoop band. Data syncs automatically.",
  },
  {
    icon: Users,
    title: "Compete With Founders",
    description: "Create private leagues or join public ones. Weekly rankings and achievements.",
  },
  {
    icon: Shield,
    title: "Achievement System",
    description: "Unlock badges for streaks, perfect rest weeks, ACWR mastery, and more.",
  },
  {
    icon: Zap,
    title: "Live Leaderboards",
    description: "Real-time score updates. See where you rank as data flows in.",
  },
];

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: ["1 public league", "Basic leaderboard", "Achievement tracking", "Weekly score updates"],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Premium",
    price: "$4.99",
    period: "/month",
    features: [
      "Unlimited private leagues",
      "All 8 leaderboard categories",
      "Advanced analytics & charts",
      "Share cards for social",
      "Priority support",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="border-b border-slate-800 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2 text-xl font-bold">
            <Trophy className="h-6 w-6 text-indigo-400" />
            <span>FounderLeague</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-5xl font-bold leading-tight tracking-tight">
            Compete on <span className="text-indigo-400">Health</span>,<br />
            Not Hustle
          </h1>
          <p className="mt-6 text-lg text-slate-400 leading-relaxed">
            FounderLeague is the gamified competition platform where founders compete on
            readiness, sleep quality, recovery — not hours worked. Connect your wearable,
            join a league, climb the leaderboard.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-500 transition-colors"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-slate-700 px-6 py-3 font-medium text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-slate-800 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold">
            Everything you need to optimize, compete, and win
          </h2>
          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-slate-800 bg-slate-900/50 p-6"
              >
                <feature.icon className="h-8 w-8 text-indigo-400" />
                <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-slate-800 px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold">Simple pricing</h2>
          <p className="mt-4 text-center text-slate-400">
            Start free. Upgrade when you want private leagues and analytics.
          </p>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border p-8 ${
                  plan.highlighted
                    ? "border-indigo-500 bg-indigo-950/30"
                    : "border-slate-800 bg-slate-900/50"
                }`}
              >
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-slate-400">{plan.period}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-slate-300">
                      <svg className="h-4 w-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`mt-8 block rounded-lg px-4 py-2.5 text-center text-sm font-medium transition-colors ${
                    plan.highlighted
                      ? "bg-indigo-600 text-white hover:bg-indigo-500"
                      : "border border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-6 py-12">
        <div className="mx-auto max-w-6xl text-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} FounderLeague. Compete on health, not hustle.</p>
        </div>
      </footer>
    </div>
  );
}
