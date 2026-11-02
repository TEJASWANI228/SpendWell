import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  Banknote,
  CreditCard,
  Landmark,
  Trash2,
} from 'lucide-react';
import type { Transaction, TransactionInput } from '@/api/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/layout/PageHeader';
import { CategoryIcon } from '@/components/transactions/CategoryIcon';
import { CATEGORIES } from '@/data/categories';
import { transactionSchema, type TransactionValues } from '@/lib/validation';
import { formatInputDate } from '@/lib/dates';
import { cn } from '@/lib/cn';

export interface TransactionFormProps {
  mode: 'create' | 'edit';
  initial?: Transaction;
  submitting?: boolean;
  onSubmit: (input: TransactionInput) => Promise<void>;
  onDelete?: () => void;
}

const paymentMethods = [
  { value: 'card', label: 'Card', icon: CreditCard },
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'bank', label: 'Bank', icon: Landmark },
] as const;

export function TransactionForm({ mode, initial, submitting = false, onSubmit, onDelete }: TransactionFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TransactionValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: initial?.type ?? 'expense',
      amount: initial ? String(initial.amount) : '',
      categoryId: initial?.categoryId ?? 'food',
      note: initial?.note ?? '',
      date: initial ? formatInputDate(initial.date) : formatInputDate(new Date().toISOString()),
      paymentMethod: initial?.paymentMethod ?? 'card',
    },
  });

  const type = watch('type');
  const categoryId = watch('categoryId');
  const paymentMethod = watch('paymentMethod');
  const amount = watch('amount');

  async function submit(values: TransactionValues) {
    setFormError(null);
    try {
      await onSubmit({
        type: values.type,
        amount: Number(values.amount),
        categoryId: values.categoryId,
        note: values.note.trim(),
        date: new Date(`${values.date}T12:00:00`).toISOString(),
        paymentMethod: values.paymentMethod,
      });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not save this transaction.');
    }
  }

  const isExpense = type === 'expense';

  return (
    <div className="min-h-[100dvh] pb-28">
      <PageHeader
        title={mode === 'create' ? 'Add transaction' : 'Edit transaction'}
        subtitle={mode === 'create' ? 'Every record is a small step forward' : 'Update the details below'}
        right={
          mode === 'edit' && onDelete ? (
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              aria-label="Delete transaction"
              className="flex h-11 w-11 items-center justify-center rounded-full text-danger transition hover:bg-[#ffebeb]"
            >
              <Trash2 className="h-[19px] w-[19px]" aria-hidden />
            </button>
          ) : null
        }
      />

      <form onSubmit={handleSubmit(submit)} noValidate className="px-5 pt-4">
        {formError ? (
          <div role="alert" className="mb-4 flex items-start gap-2 rounded-[10px] bg-[#ffebeb] p-3 text-psm text-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{formError}</span>
          </div>
        ) : null}

        <div className="grid grid-cols-2 rounded-[12px] bg-grey-100 p-1" role="group" aria-label="Transaction type">
          {[
            { value: 'expense' as const, label: 'Expense' },
            { value: 'income' as const, label: 'Income' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={type === option.value}
              onClick={() => {
                setValue('type', option.value, { shouldValidate: true });
                if (option.value === 'income' && categoryId === 'food') {
                  setValue('categoryId', 'other');
                }
              }}
              className={cn(
                'min-h-[44px] rounded-[9px] text-psm font-medium transition-all',
                type === option.value
                  ? option.value === 'income'
                    ? 'bg-white text-success shadow-sm'
                    : 'bg-white text-ink-900 shadow-sm'
                  : 'text-ink-500',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div
          className={cn(
            'mt-4 rounded-[16px] border p-5 text-center transition-colors',
            isExpense ? 'border-brand-100 bg-brand-50' : 'border-[#d5f0e5] bg-[#f0fbf7]',
          )}
        >
          <label htmlFor="amount" className="text-caption font-medium uppercase tracking-wide text-ink-500">
            Amount
          </label>
          <div className="mt-1 flex items-center justify-center gap-1">
            <span
              className={cn(
                'text-h5 font-semibold',
                isExpense ? 'text-brand-700' : 'text-success',
              )}
              aria-hidden
            >
              $
            </span>
            <input
              id="amount"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              aria-invalid={errors.amount ? true : undefined}
              aria-describedby={errors.amount ? 'amount-error' : undefined}
              className={cn(
                'w-[190px] bg-transparent text-center text-[38px] font-semibold tracking-[-0.03em] outline-none',
                'placeholder:text-ink-400',
                isExpense ? 'text-brand-900' : 'text-success',
              )}
              {...register('amount')}
            />
          </div>
          {errors.amount?.message ? (
            <p id="amount-error" role="alert" className="mt-1 flex items-center justify-center gap-1 text-caption text-danger">
              <AlertCircle className="h-3.5 w-3.5" aria-hidden />
              {errors.amount.message}
            </p>
          ) : (
            <p className="mt-1 text-caption text-ink-400">
              {amount ? `You’re recording $${Number(amount || 0).toFixed(2)}` : 'Enter an amount above'}
            </p>
          )}
        </div>

        <fieldset className="mt-5">
          <legend className="mb-2 text-psm font-medium text-ink-700">Category</legend>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map((category) => {
              const selected = categoryId === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setValue('categoryId', category.id, { shouldValidate: true })}
                  className={cn(
                    'relative flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-[12px] border px-1 py-2 transition-all',
                    selected
                      ? 'border-brand-700 bg-brand-50 shadow-[0_0_0_1px_#6f33ff_inset]'
                      : 'border-grey-200 bg-white hover:border-brand-300 hover:bg-brand-50/40',
                  )}
                >
                  <CategoryIcon categoryId={category.id} size="sm" />
                  <span
                    className={cn(
                      'line-clamp-1 text-[10px] font-medium leading-tight',
                      selected ? 'text-brand-700' : 'text-ink-500',
                    )}
                  >
                    {category.name}
                  </span>
                </button>
              );
            })}
          </div>
          {errors.categoryId?.message ? (
            <p role="alert" className="mt-1.5 text-caption text-danger">
              {errors.categoryId.message}
            </p>
          ) : null}
        </fieldset>

        <div className="mt-5 space-y-4">
          <Input
            label="Note"
            placeholder="e.g. Lunch with friends"
            maxLength={80}
            error={errors.note?.message}
            {...register('note')}
          />

          <Input
            label="Date"
            type="date"
            error={errors.date?.message}
            {...register('date')}
          />

          <fieldset>
            <legend className="mb-2 text-psm font-medium text-ink-700">Paid with</legend>
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map((method) => {
                const selected = paymentMethod === method.value;
                return (
                  <button
                    key={method.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setValue('paymentMethod', method.value, { shouldValidate: true })}
                    className={cn(
                      'flex min-h-[52px] items-center justify-center gap-1.5 rounded-[12px] border text-psm font-medium transition',
                      selected
                        ? 'border-brand-700 bg-brand-50 text-brand-700'
                        : 'border-grey-200 bg-white text-ink-500 hover:border-brand-300',
                    )}
                  >
                    <method.icon className="h-4 w-4" aria-hidden />
                    {method.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-t border-grey-100 bg-white/95 px-5 pb-[max(18px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={submitting || isSubmitting}
          >
            {mode === 'create' ? 'Save transaction' : 'Save changes'}
          </Button>
        </div>
      </form>

      {onDelete ? (
        <Modal
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          title="Delete this transaction?"
          description="This removes it from your history and updates your budget. You can’t undo this."
          footer={
            <>
              <Button variant="outline" fullWidth onClick={() => setDeleteOpen(false)}>
                Keep it
              </Button>
              <Button
                variant="danger"
                fullWidth
                onClick={() => {
                  setDeleteOpen(false);
                  onDelete();
                }}
              >
                Delete
              </Button>
            </>
          }
        >
          <div className="rounded-[10px] bg-grey-100 p-3 text-psm text-ink-600">
            <span className="font-medium text-ink-900">{initial?.note}</span>
            <span className="ml-2 tabular-nums">
              ${initial ? initial.amount.toFixed(2) : '0.00'}
            </span>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
