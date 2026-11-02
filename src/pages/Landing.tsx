import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  BellRing,
  Check,
  ChevronRight,
  CreditCard,
  Leaf,
  Lock,
  PiggyBank,
  Sparkles,
  Star,
  Target,
  Wallet,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Avatar } from '@/components/ui/Avatar';
import { RingProgress } from '@/components/ui/RingProgress';
import { CategoryIcon } from '@/components/transactions/CategoryIcon';

const features = [
  {
    icon: Wallet,
    title: 'Budgets that breathe',
    description: 'Set a monthly limit and gentle category caps. SpendWell nudges you before you overspend — never after.',
  },
  {
    icon: BarChart3,
    title: 'Insights you can act on',
    description: 'Clear income-vs-expense bars and a category donut that shows exactly where your money went.',
  },
  {
    icon: PiggyBank,
    title: 'Savings that add up',
    description: 'Roll over what you don’t spend and watch small, consistent choices become a real safety net.',
  },
  {
    icon: BellRing,
    title: 'Calm, timely nudges',
    description: 'Alerts at 80% and 100% of a budget, plus a weekly recap. No shame, no spam, no surprises.',
  },
  {
    icon: Target,
    title: 'Every category covered',
    description: 'Food, transport, bills, fun — ten thoughtful categories, each with its own colour and limit.',
  },
  {
    icon: Lock,
    title: 'Private by design',
    description: 'Your data is yours. Export it anytime, lock the app, and never worry about who else is looking.',
  },
];

const steps = [
  { number: '01', title: 'Connect your money picture', description: 'Add your income and the categories that matter. Takes under two minutes.' },
  { number: '02', title: 'Set a budget you can keep', description: 'Choose a monthly total and gentle limits for each category. Adjust anytime.' },
  { number: '03', title: 'Spend mindfully, grow steadily', description: 'Log purchases, follow your insights, and let unused budget roll forward.' },
];

const testimonials = [
  {
    quote: 'I finally know where my money goes without a spreadsheet. The weekly recap is the only “finance app” notification I actually read.',
    name: 'Maya Chen',
    role: 'Product designer',
  },
  {
    quote: 'The 80% nudge is magic. It’s early enough to change course, not so early that it feels restrictive.',
    name: 'Daniel Okafor',
    role: 'Graduate student',
  },
  {
    quote: 'SpendWell made budgeting feel like self-care instead of punishment. I’ve saved more in three months than in three years.',
    name: 'Sofia Alvarez',
    role: 'Freelance writer',
  },
];

export function Landing() {
  return (
    <div className="min-h-screen bg-white text-ink-900">
      <header className="sticky top-0 z-50 border-b border-grey-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1200px] items-center justify-between px-6">
          <Link to="/landing" aria-label="SpendWell home" className="rounded-lg">
            <Logo size={38} withWordmark />
          </Link>
          <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
            {[
              { label: 'Features', href: '#features' },
              { label: 'How it works', href: '#how-it-works' },
              { label: 'Stories', href: '#stories' },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-psm font-medium text-ink-600 transition hover:text-brand-700"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="hidden min-h-[44px] items-center rounded-full px-4 text-psm font-medium text-ink-700 transition hover:bg-grey-100 sm:flex"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-brand-700 px-5 text-psm font-semibold text-white shadow-brand transition hover:bg-brand-600"
            >
              Get started
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-brand-50 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -left-32 top-40 h-[360px] w-[360px] rounded-full bg-[#f2ecff] blur-3xl" />
          <div className="relative mx-auto grid max-w-[1200px] items-center gap-16 px-6 pb-24 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:pb-28 lg:pt-24">
            <div className="animate-fade-up">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3.5 py-1.5 text-caption font-semibold text-brand-700">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Mindful money, every day
              </span>
              <h1 className="mt-6 max-w-[560px] text-[44px] font-semibold leading-[1.05] tracking-[-0.045em] text-ink-900 sm:text-[58px] lg:text-[64px]">
                Spend well.
                <br />
                <span className="text-brand-700">Live lighter.</span>
              </h1>
              <p className="mt-6 max-w-[480px] text-[17px] leading-relaxed text-ink-500">
                SpendWell turns everyday spending into calm, clear progress. Track purchases, set
                budgets that flex with real life, and grow savings without spreadsheets or guilt.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/signup"
                  className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-[14px] bg-brand-700 px-7 text-pmd font-semibold text-white shadow-brand transition hover:-translate-y-0.5 hover:bg-brand-600"
                >
                  Start for free
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-[14px] border border-grey-300 bg-white px-7 text-pmd font-semibold text-ink-800 transition hover:border-brand-300 hover:text-brand-700"
                >
                  See the live demo
                </Link>
              </div>
              <div className="mt-8 flex items-center gap-3">
                <div className="flex -space-x-2.5">
                  {['Maya Chen', 'Daniel Okafor', 'Sofia Alvarez', 'Noah Kim'].map((name) => (
                    <Avatar key={name} name={name} size="sm" className="ring-2 ring-white" />
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1 text-warning" aria-label="Rated 4.9 out of 5">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} className="h-3.5 w-3.5 fill-current" aria-hidden />
                    ))}
                    <span className="ml-1 text-caption font-semibold text-ink-700">4.9</span>
                  </div>
                  <p className="text-caption text-ink-400">Loved by 12,000+ mindful spenders</p>
                </div>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[420px]">
              <div aria-hidden className="absolute inset-0 -z-10 translate-x-6 translate-y-6 rounded-[44px] bg-brand-100/60 blur-2xl" />
              <div className="relative mx-auto w-[318px] rounded-[44px] border-[10px] border-ink-900 bg-ink-900 p-1.5 shadow-[0_32px_80px_rgba(21,18,28,0.28)]">
                <div className="relative overflow-hidden rounded-[33px] bg-white">
                  <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-ink-900" />
                  <div className="px-4 pb-5 pt-9">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[9px] text-ink-400">Good morning,</p>
                        <p className="text-[13px] font-semibold text-ink-900">Alex</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-grey-100">
                          <BellRing className="h-3.5 w-3.5 text-ink-600" aria-hidden />
                        </span>
                        <Avatar name="Alex Morgan" size="xs" />
                      </div>
                    </div>

                    <div className="relative mt-3 overflow-hidden rounded-[16px] bg-gradient-to-br from-brand-700 to-brand-500 p-4 text-white">
                      <div aria-hidden className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/10" />
                      <p className="text-[9px] text-white/70">Total balance</p>
                      <p className="mt-0.5 text-[24px] font-semibold tracking-[-0.03em]">$12,480.50</p>
                      <span className="mt-1.5 inline-flex items-center gap-1 rounded-pill bg-white/15 px-2 py-0.5 text-[8px]">
                        <ArrowRight className="h-2.5 w-2.5 -rotate-45" aria-hidden />
                        12.4% this month
                      </span>
                      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/15 pt-2.5">
                        <div>
                          <p className="text-[8px] text-white/60">Income</p>
                          <p className="text-[11px] font-semibold">$4,850</p>
                        </div>
                        <div>
                          <p className="text-[8px] text-white/60">Expenses</p>
                          <p className="text-[11px] font-semibold">$3,420</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-3 rounded-[12px] border border-grey-100 p-3">
                      <RingProgress value={76} size={56} stroke={6} tone="brand" label="Budget used">
                        <span className="text-[9px] font-semibold">76%</span>
                      </RingProgress>
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] text-ink-400">Monthly budget</p>
                        <p className="text-[12px] font-semibold">$1,080 left</p>
                        <div className="mt-1 h-1 overflow-hidden rounded-pill bg-grey-100">
                          <div className="h-full w-[76%] rounded-pill bg-brand-700" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-semibold">Recent</p>
                        <p className="text-[8px] font-medium text-brand-700">See all</p>
                      </div>
                      <div className="mt-1.5 space-y-2">
                        {[
                          { category: 'food' as const, note: 'Morning coffee', amount: '−$6.40' },
                          { category: 'groceries' as const, note: 'Weekly groceries', amount: '−$82.35' },
                          { category: 'transport' as const, note: 'Uber to campus', amount: '−$14.20' },
                        ].map((item) => (
                          <div key={item.note} className="flex items-center gap-2">
                            <CategoryIcon categoryId={item.category} size="sm" className="!h-7 !w-7" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[9px] font-medium text-ink-800">{item.note}</p>
                              <p className="text-[8px] capitalize text-ink-400">{item.category}</p>
                            </div>
                            <p className="text-[9px] font-semibold text-ink-800">{item.amount}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -left-2 top-24 hidden animate-float rounded-[12px] border border-grey-100 bg-white p-3 shadow-float sm:block">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e6f7f1] text-success">
                    <PiggyBank className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <p className="text-[9px] text-ink-400">Saved this month</p>
                    <p className="text-[12px] font-semibold text-ink-900">+$1,430</p>
                  </div>
                </div>
              </div>

              <div className="absolute -right-3 bottom-16 hidden animate-float rounded-[12px] border border-grey-100 bg-white p-3 shadow-float sm:block" style={{ animationDelay: '1.4s' }}>
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                    <Leaf className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <p className="text-[9px] text-ink-400">On track</p>
                    <p className="text-[12px] font-semibold text-ink-900">No overspending</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section aria-label="Results" className="border-y border-grey-100 bg-grey-50/60">
          <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-6 px-6 py-10 sm:grid-cols-4">
            {[
              { value: '12k+', label: 'Mindful spenders' },
              { value: '$2.4M', label: 'Saved collectively' },
              { value: '38%', label: 'Less overspending' },
              { value: '4.9/5', label: 'Average rating' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-h5 font-semibold text-ink-900 sm:text-h4">{stat.value}</p>
                <p className="mt-1 text-caption text-ink-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="mx-auto max-w-[1200px] px-6 py-20 lg:py-28">
          <div className="mx-auto max-w-[620px] text-center">
            <span className="text-caption font-semibold uppercase tracking-[0.18em] text-brand-700">Features</span>
            <h2 className="mt-3 text-h3 leading-tight text-ink-900 sm:text-[40px]">
              Everything you need. Nothing you don’t.
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-ink-500">
              Thoughtful tools for everyday money — designed to inform, not overwhelm.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="group rounded-[16px] border border-grey-100 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-float"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-brand-50 text-brand-700 transition group-hover:bg-brand-700 group-hover:text-white">
                  <feature.icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-pmd font-semibold text-ink-900">{feature.title}</h3>
                <p className="mt-2 text-psm leading-relaxed text-ink-500">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="bg-ink-900 py-20 text-white lg:py-28">
          <div className="mx-auto max-w-[1200px] px-6">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
              <div>
                <span className="text-caption font-semibold uppercase tracking-[0.18em] text-brand-300">How it works</span>
                <h2 className="mt-3 text-h3 leading-tight text-white sm:text-[40px]">
                  Three small steps.
                  <br />
                  One calmer month.
                </h2>
                <p className="mt-4 max-w-[380px] text-psm leading-relaxed text-white/60">
                  No bank connections required to start. SpendWell works with the numbers you already
                  know.
                </p>
                <Link
                  to="/signup"
                  className="mt-8 inline-flex min-h-[50px] items-center gap-2 rounded-[12px] bg-white px-6 text-psm font-semibold text-ink-900 transition hover:bg-brand-50"
                >
                  Create your free account
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>

              <div className="space-y-3">
                {steps.map((step) => (
                  <div
                    key={step.number}
                    className="flex gap-5 rounded-[16px] border border-white/10 bg-white/[0.04] p-5 transition hover:bg-white/[0.07]"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-700 text-psm font-semibold text-white">
                      {step.number}
                    </span>
                    <div>
                      <h3 className="text-pmd font-semibold text-white">{step.title}</h3>
                      <p className="mt-1 text-psm leading-relaxed text-white/55">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="stories" className="mx-auto max-w-[1200px] px-6 py-20 lg:py-28">
          <div className="mx-auto max-w-[620px] text-center">
            <span className="text-caption font-semibold uppercase tracking-[0.18em] text-brand-700">Stories</span>
            <h2 className="mt-3 text-h3 leading-tight text-ink-900 sm:text-[40px]">
              Real people. Real breathing room.
            </h2>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <figure key={testimonial.name} className="flex flex-col rounded-[16px] border border-grey-100 bg-white p-6 shadow-card">
                <div className="flex items-center gap-1 text-warning" role="img" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="h-3.5 w-3.5 fill-current" aria-hidden />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-psm leading-relaxed text-ink-700">
                  “{testimonial.quote}”
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-grey-100 pt-4">
                  <Avatar name={testimonial.name} size="sm" />
                  <div>
                    <p className="text-psm font-semibold text-ink-900">{testimonial.name}</p>
                    <p className="text-caption text-ink-400">{testimonial.role}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="px-6 pb-20 lg:pb-28">
          <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[28px] bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 px-6 py-16 text-center text-white shadow-float sm:px-12">
            <div aria-hidden className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10" />
            <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-white/10" />
            <div className="relative mx-auto max-w-[620px]">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-caption font-semibold">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Free to start. Yours forever.
              </span>
              <h2 className="mt-5 text-h3 leading-tight text-white sm:text-[42px]">
                Your next month could feel a lot lighter.
              </h2>
              <p className="mt-4 text-psm leading-relaxed text-white/70">
                Join thousands of people who traded money stress for small, steady wins.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  to="/signup"
                  className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-[14px] bg-white px-7 text-pmd font-semibold text-brand-700 transition hover:-translate-y-0.5"
                >
                  Get started free
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-[14px] border border-white/30 px-7 text-pmd font-semibold text-white transition hover:bg-white/10"
                >
                  Log in
                </Link>
              </div>
              <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-caption text-white/70">
                {['No card required', 'Cancel anytime', 'Export your data'].map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-grey-100 bg-grey-50/50">
        <div className="mx-auto max-w-[1200px] px-6 py-12">
          <div className="flex flex-col gap-10 md:flex-row md:justify-between">
            <div className="max-w-[280px]">
              <Logo size={36} withWordmark />
              <p className="mt-3 text-psm leading-relaxed text-ink-500">
                Mindful money, every day. A calmer way to track, budget and grow.
              </p>
              <div className="mt-4 flex items-center gap-2 text-caption text-ink-400">
                <CreditCard className="h-4 w-4" aria-hidden />
                Your data stays yours.
              </div>
            </div>
            <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
              {[
                { title: 'Product', links: ['Features', 'How it works', 'Stories'] },
                { title: 'Company', links: ['About', 'Careers', 'Contact'] },
                { title: 'Legal', links: ['Privacy', 'Terms', 'Security'] },
              ].map((column) => (
                <div key={column.title}>
                  <h3 className="text-caption font-semibold uppercase tracking-wide text-ink-400">{column.title}</h3>
                  <ul className="mt-3 space-y-2">
                    {column.links.map((link) => (
                      <li key={link}>
                        <a href="#features" className="group inline-flex items-center gap-1 text-psm text-ink-600 transition hover:text-brand-700">
                          {link}
                          <ChevronRight className="h-3 w-3 opacity-0 transition group-hover:opacity-100" aria-hidden />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-grey-200 pt-6 text-caption text-ink-400 sm:flex-row">
            <p>© {new Date().getFullYear()} SpendWell. All rights reserved.</p>
            <p>Made for calmer money · Poppins &amp; purple</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
