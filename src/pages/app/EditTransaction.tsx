import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, RefreshCw } from 'lucide-react';
import { useDeleteTransaction, useTransaction, useUpdateTransaction } from '@/api/queries';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/layout/PageHeader';
import { useToast } from '@/components/ui/Toast';

export function EditTransaction() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { data, isLoading, isError, refetch } = useTransaction(id);
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

  if (isLoading) {
    return (
      <div className="min-h-[100dvh]">
        <PageHeader title="Edit transaction" subtitle="Loading details" />
        <div className="flex h-[60vh] items-center justify-center text-brand-700">
          <Loader2 className="h-7 w-7 animate-spin" aria-label="Loading transaction" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-[100dvh]">
        <PageHeader title="Edit transaction" />
        <div className="flex flex-col items-center px-8 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#ffebeb] text-danger">
            <RefreshCw className="h-6 w-6" aria-hidden />
          </div>
          <h1 className="text-pmd font-semibold text-ink-900">Transaction not found</h1>
          <p className="mt-1.5 text-psm text-ink-500">It may have been deleted already.</p>
          <div className="mt-5 flex gap-3">
            <Button variant="outline" onClick={() => void refetch()}>
              Try again
            </Button>
            <Button onClick={() => navigate('/app/transactions')}>Back to activity</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TransactionForm
      mode="edit"
      initial={data}
      submitting={updateTransaction.isPending}
      onSubmit={async (input) => {
        await updateTransaction.mutateAsync({ id: data.id, values: input });
        showToast({
          title: 'Transaction updated',
          description: 'Your balances have been recalculated.',
          tone: 'success',
        });
        navigate('/app/transactions', { replace: true });
      }}
      onDelete={() => {
        void deleteTransaction.mutateAsync(data.id).then(() => {
          showToast({
            title: 'Transaction deleted',
            description: 'Your history and budget were updated.',
            tone: 'info',
          });
          navigate('/app/transactions', { replace: true });
        });
      }}
    />
  );
}
