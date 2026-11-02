import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Lock, Sparkles, TrendingUp, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { RingProgress } from '@/components/ui/RingProgress';
import { cn } from '@/lib/cn';
import { ONBOARDED_KEY } from '@/pages/auth/Splash';

interface Slide {
  eyebrow: string;
  title: string;
  description: string;
  art: ReactNode;
}

function SpendArt() {
  return (
    <div className="relative h-full w-full">
      <div className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-card">
        <RingProgress
          value={62}
          size={176}
          stroke={18}
          tone="brand"
          trackColor="#ede4ff"
          label="Spent this month"
        >
          <span className="text-caption text-ink-400">Spent</span>
          <span className="text-h6 text-ink-900">$2,780</span>
          <span className="text-[10px] font-medium text-brand-700">62% of budget</span>
        </RingProgress>
      </div>
      <div className="absolute left-4 top-6 flex items-center gap-2 rounded-[10px] bg-white px-3 py-2 shadow-card">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e6f7f1] text-success">
          <TrendingUp className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <p className="text-[10px] text-ink-400">Saved</p>
          <p className="text-caption font-semibold text-ink-900">$1,720</p>
        </div>
      </div>
      <div className="absolute bottom-7 right-4 rounded-[10px] bg-ink-900 px-3 py-2 text-white shadow-card">
        <p className="text-[10px] text-white/60">Food & drinks</p>
        <p className="text-caption font-semibold">$420 · 28%</p>
      </div>
    </div>
  );
}

function BudgetArt() {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div className="w-[248px] rounded-[16px] bg-white p-4 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-ink-400">Monthly budget</p>
            <p className="text-h6 text-ink-900">$4,500</p>
          </div>
          <span className="rounded-pill bg-brand-50 px-2 py-1 text-[10px] font-medium text-brand-700">
            On track
          </span>
        </div>
        <div className="mt-4 space-y-3">
          {[
            { label: 'Groceries', value: 68, color: 'bg-[#59a662]' },
            { label: 'Shopping', value: 44, color: 'bg-brand-500' },
            { label: 'Transport', value: 82, color: 'bg-[#f79009]' },
          ].map((row) => (
            <div key={row.label}>
              <div className="mb-1 flex justify-between text-[10px]">
                <span className="font-medium text-ink-700">{row.label}</span>
                <span className="text-ink-400">{row.value}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-pill bg-grey-100">
                <div className={cn('h-full rounded-pill', row.color)} style={{ width: `${row.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute -right-1 top-5 flex h-12 w-12 items-center justify-center rounded-[14px] bg-brand-700 text-white shadow-float">
        <Wallet className="h-5 w-5" aria-hidden />
      </div>
      <div className="absolute -left-1 bottom-6 flex items-center gap-1.5 rounded-pill bg-white px-3 py-1.5 shadow-card">
        <Check className="h-3.5 w-3.5 text-success" aria-hidden />
        <span className="text-[10px] font-medium text-ink-700">No overspending</span>
      </div>
    </div>
  );
}

function SaveArt() {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div className="w-[250px] rounded-[16px] bg-white p-4 shadow-card">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-ink-400">Savings goal</p>
            <p className="text-h5 text-ink-900">$6,400</p>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            <Sparkles className="h-4 w-4" aria-hidden />
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1 text-[10px] font-medium text-success">
          <TrendingUp className="h-3 w-3" aria-hidden />
          +12.4% this month
        </div>
        <svg viewBox="0 0 220 72" className="mt-3 w-full" role="img" aria-label="Savings trending upward">
          <defs>
            <linearGradient id="save-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#6f33ff" stopOpacity="0.22" />
              <stop offset="1" stopColor="#6f33ff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0 58 C30 54 42 38 66 40 C92 42 100 22 126 24 C152 26 164 12 220 4 L220 72 L0 72 Z" fill="url(#save-fill)" />
          <path
            d="M0 58 C30 54 42 38 66 40 C92 42 100 22 126 24 C152 26 164 12 220 4"
            fill="none"
            stroke="#6f33ff"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="absolute -left-1 top-8 flex items-center gap-2 rounded-[10px] bg-white px-3 py-2 shadow-card">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#fff4e5] text-warning">
          <Lock className="h-3.5 w-3.5" aria-hidden />
        </span>
        <div>
          <p className="text-[10px] text-ink-400">Auto-save</p>
          <p className="text-[10px] font-semibold text-ink-900">$25 / week</p>
        </div>
      </div>
    </div>
  );
}

const SLIDES = [
  {
    eyebrow: 'Clarity',
    title: 'Know exactly where your money goes',
    description:
      'Every purchase, sorted into clear categories. See your spending at a glance without spreadsheets.',
    art: <SpendArt />,
  },
  {
    eyebrow: 'Control',
    title: 'Set budgets that feel achievable',
    description:
      'Give each category a gentle limit and get a nudge before you overspend — never a guilt trip.',
    art: <BudgetArt />,
  },
  {
    eyebrow: 'Growth',
    title: 'Grow your savings, one day at a time',
    description:
      'Watch small, consistent choices add up. SpendWell turns mindful spending into real progress.',
    art: <SaveArt />,
  },
] as const satisfies readonly Slide[];

export function Onboarding() {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();
  const slide = SLIDES[index] ?? SLIDES[0];
  const isLast = index === SLIDES.length - 1;

  function finish(destination: '/login' | '/signup') {
    localStorage.setItem(ONBOARDED_KEY, 'true');
    navigate(destination, { replace: true });
  }

  function next() {
    if (isLast) {
      finish('/signup');
    } else {
      setIndex((current) => current + 1);
    }
  }

  return (
    <main className="app-shell flex min-h-[100dvh] flex-col bg-white px-6 pb-8 pt-5">
      <div className="flex items-center justify-between">
        <Logo size={36} withWordmark />
        <button
          type="button"
          onClick={() => finish('/login')}
          className="flex min-h-[44px] items-center rounded-full px-3 text-psm font-medium text-ink-400 transition hover:bg-grey-100 hover:text-ink-700"
        >
          Skip
        </button>
      </div>

      <div className="relative mt-6 flex-1">
        <div className="relative h-[330px] overflow-hidden rounded-[24px] bg-gradient-to-br from-brand-50 via-[#f4efff] to-[#efe8ff]">
          <div aria-hidden className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/60" />
          <div aria-hidden className="absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-white/50" />
          <div key={index} className="absolute inset-0 p-6 animate-fade-in">
            {slide.art}
          </div>
        </div>

        <div key={`copy-${index}`} className="mt-7 animate-fade-up">
          <span className="text-caption font-semibold uppercase tracking-[0.18em] text-brand-700">
            {slide.eyebrow}
          </span>
          <h1 className="mt-2 text-h4 leading-[1.2] text-ink-900">{slide.title}</h1>
          <p className="mt-3 text-psm leading-relaxed text-ink-500">{slide.description}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-1" aria-label={`Step ${index + 1} of ${SLIDES.length}`}>
        {SLIDES.map((item, dotIndex) => (
          <button
            key={item.eyebrow}
            type="button"
            aria-label={`Go to slide ${dotIndex + 1}`}
            aria-current={dotIndex === index}
            onClick={() => setIndex(dotIndex)}
            className="group flex h-11 w-7 items-center justify-center rounded-full"
          >
            <span
              className={cn(
                'h-2 rounded-pill transition-all duration-300',
                dotIndex === index
                  ? 'w-7 bg-brand-700'
                  : 'w-2 bg-grey-300 group-hover:bg-grey-400',
              )}
            />
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-2">
        <Button
          fullWidth
          size="lg"
          onClick={next}
          rightIcon={<ArrowRight className="h-[18px] w-[18px]" aria-hidden />}
        >
          {isLast ? 'Get started' : 'Continue'}
        </Button>
        <button
          type="button"
          onClick={() => finish('/login')}
          className="flex min-h-[44px] w-full items-center justify-center rounded-[12px] text-psm font-medium text-ink-500 transition hover:text-brand-700"
        >
          I already have an account
        </button>
      </div>
    </main>
  );
}
