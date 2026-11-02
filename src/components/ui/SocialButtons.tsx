import { Button } from '@/components/ui/Button';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.92l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.28A7.2 7.2 0 0 1 4.91 12c0-.79.14-1.56.38-2.28v-3.1H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.38l4.01-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.61 4.58 1.8l3.44-3.44A11.96 11.96 0 0 0 12 0 12 12 0 0 0 1.28 6.62l4.01 3.1C6.23 6.88 8.88 4.77 12 4.77Z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.36 12.74c.02 2.44 2.14 3.25 2.16 3.26-.02.06-.34 1.16-1.11 2.3-.67.98-1.36 1.96-2.45 1.98-1.07.02-1.42-.63-2.64-.63-1.22 0-1.61.61-2.62.65-1.05.04-1.85-1.06-2.53-2.03-1.38-2-2.43-5.65-1.02-8.12.7-1.23 1.96-2.01 3.32-2.03 1.04-.02 2.01.7 2.64.7.63 0 1.81-.86 3.05-.73.52.02 1.98.21 2.91 1.58-.08.05-1.74 1.02-1.71 3.07ZM14.4 4.6c.56-.68.94-1.62.83-2.56-.81.03-1.79.54-2.37 1.22-.52.6-.98 1.56-.86 2.48.9.07 1.83-.46 2.4-1.14Z" />
    </svg>
  );
}

/** Props for the new functional Google+Apple button row. */
export interface SocialButtonsProps {
  /** Called when the Google button is clicked. Replaces the old `onSelect` callback. */
  onGoogle: () => void;
  /** Called when the Apple button is clicked. */
  onApple: () => void;
  /** Shows a loading spinner on the Google button while the sign-in is in flight. */
  googleLoading?: boolean;
}

export function SocialButtons({ onGoogle, onApple, googleLoading = false }: SocialButtonsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Button
        variant="outline"
        size="md"
        onClick={onGoogle}
        leftIcon={<GoogleIcon />}
        loading={googleLoading}
      >
        Google
      </Button>
      <Button variant="outline" size="md" onClick={onApple} leftIcon={<AppleIcon />}>
        Apple
      </Button>
    </div>
  );
}

export function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3" aria-hidden>
      <span className="h-px flex-1 bg-grey-200" />
      <span className="text-caption text-ink-400">{label}</span>
      <span className="h-px flex-1 bg-grey-200" />
    </div>
  );
}
