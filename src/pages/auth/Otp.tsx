import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, MailCheck, RotateCcw } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useRequestOtp, useVerifyOtp } from '@/api/queries';

const LENGTH = 6;

export function Otp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const verifyOtp = useVerifyOtp();
  const requestOtp = useRequestOtp();
  const state = location.state as { email?: string } | null;
  const email = state?.email ?? 'your email';
  const [digits, setDigits] = useState<string[]>(Array.from({ length: LENGTH }, () => ''));
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(30);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = window.setInterval(() => setSeconds((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [seconds]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  const code = digits.join('');

  function setDigit(index: number, raw: string) {
    const clean = raw.replace(/\D/g, '').slice(-1);
    setDigits((current) => {
      const next = [...current];
      next[index] = clean;
      return next;
    });
    setError(null);
    if (clean && index < LENGTH - 1) inputs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowLeft' && index > 0) inputs.current[index - 1]?.focus();
    if (event.key === 'ArrowRight' && index < LENGTH - 1) inputs.current[index + 1]?.focus();
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, LENGTH);
    if (!pasted) return;
    const next = Array.from({ length: LENGTH }, (_, index) => pasted[index] ?? '');
    setDigits(next);
    setError(null);
    inputs.current[Math.min(pasted.length, LENGTH - 1)]?.focus();
  }

  async function handleSubmit() {
    if (code.length !== LENGTH) {
      setError('Enter all 6 digits to continue.');
      return;
    }
    setError(null);
    try {
      const result = await verifyOtp.mutateAsync({ email: state?.email ?? 'alex@spendwell.app', code });
      showToast({ title: 'Code verified', description: 'Create a new password.', tone: 'success' });
      navigate('/create-password', { state: { token: result.resetToken, email } });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'That code is not valid.');
    }
  }

  async function handleResend() {
    if (seconds > 0) return;
    try {
      await requestOtp.mutateAsync(state?.email ?? 'alex@spendwell.app');
      setSeconds(30);
      setDigits(Array.from({ length: LENGTH }, () => ''));
      setError(null);
      showToast({ title: 'New code sent', description: `Check ${email}.`, tone: 'success' });
      inputs.current[0]?.focus();
    } catch (resendError) {
      setError(resendError instanceof Error ? resendError.message : 'Could not resend the code.');
    }
  }

  return (
    <AuthLayout
      compactHero
      backTo="/forgot-password"
      title="Enter the code"
      subtitle={`We sent a 6-digit code to ${email}. It expires in 10 minutes.`}
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-[12px] bg-brand-50 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-brand-700">
            <MailCheck className="h-5 w-5" aria-hidden />
          </span>
          <p className="text-caption leading-relaxed text-ink-500">
            Didn’t get it? Check spam, or resend once the timer finishes. For this demo, any 6 digits work.
          </p>
        </div>

        <div>
          <div className="flex justify-between gap-2" onPaste={handlePaste} role="group" aria-label="6-digit verification code">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  inputs.current[index] = element;
                }}
                value={digit}
                onChange={(event) => setDigit(index, event.target.value)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                inputMode="numeric"
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                aria-label={`Digit ${index + 1} of ${LENGTH}`}
                aria-invalid={error ? true : undefined}
                maxLength={1}
                className={`h-[58px] w-full rounded-[12px] border text-center text-h6 font-semibold text-ink-900 outline-none transition-all ${
                  error
                    ? 'border-danger bg-[#fff7f7]'
                    : digit
                      ? 'border-brand-700 bg-brand-50'
                      : 'border-grey-300 bg-white focus:border-brand-700 focus:ring-2 focus:ring-brand-700/15'
                }`}
              />
            ))}
          </div>
          {error ? (
            <p role="alert" className="mt-2 flex items-center gap-1.5 text-caption text-danger">
              <AlertCircle className="h-3.5 w-3.5" aria-hidden />
              {error}
            </p>
          ) : null}
        </div>

        <Button
          fullWidth
          size="lg"
          onClick={handleSubmit}
          loading={verifyOtp.isPending}
          disabled={code.length !== LENGTH}
        >
          Verify code
        </Button>

        <div className="flex items-center justify-center gap-1.5 text-psm text-ink-500">
          {seconds > 0 ? (
            <span>
              Resend code in{' '}
              <span className="font-semibold tabular-nums text-ink-900">0:{String(seconds).padStart(2, '0')}</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={requestOtp.isPending}
              className="flex min-h-[44px] items-center gap-1.5 font-semibold text-brand-700 hover:underline disabled:opacity-60"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              Resend code
            </button>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}
