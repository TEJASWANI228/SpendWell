import { useNavigate } from 'react-router-dom';
import { useCreateTransaction } from '@/api/queries';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { useToast } from '@/components/ui/Toast';

export function AddTransaction() {
  const navigate = useNavigate();
  const createTransaction = useCreateTransaction();
  const { showToast } = useToast();

  return (
    <TransactionForm
      mode="create"
      submitting={createTransaction.isPending}
      onSubmit={async (input) => {
        await createTransaction.mutateAsync(input);
        showToast({
          title: 'Transaction saved',
          description: 'Your budget and insights are up to date.',
          tone: 'success',
        });
        navigate('/app/transactions', { replace: true });
      }}
    />
  );
}
