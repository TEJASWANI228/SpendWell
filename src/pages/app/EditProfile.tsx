import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Camera, Mail, Phone, Trash2, UserRound, Wallet } from 'lucide-react';
import type { User } from '@/api/types';
import { useMe, useUpdateProfile } from '@/api/queries';
import { useAuth } from '@/auth/AuthContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { profileSchema, type ProfileValues } from '@/lib/validation';

const MAX_AVATAR_BYTES = 1_000_000;

function EditProfileForm({ user }: { user: User }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { updateUser } = useAuth();
  const updateProfile = useUpdateProfile();
  const fileInput = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarUrl);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      phone: user.phone,
      monthlyIncome: String(user.monthlyIncome),
    },
  });

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast({ title: 'Choose an image file', tone: 'error' });
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      showToast({
        title: 'Image is too large',
        description: 'Please choose a photo under 1 MB.',
        tone: 'error',
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  }

  async function submit(values: ProfileValues) {
    setFormError(null);
    try {
      const updated = await updateProfile.mutateAsync({
        name: values.name,
        email: values.email,
        phone: values.phone,
        monthlyIncome: Number(values.monthlyIncome),
        avatarUrl: avatarPreview,
      });
      updateUser(updated);
      showToast({ title: 'Profile updated', description: 'Your details are saved.', tone: 'success' });
      navigate('/app/profile', { replace: true });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not save your profile.');
    }
  }

  return (
    <div className="min-h-[100dvh] pb-28">
      <PageHeader title="Edit profile" subtitle="Keep your details up to date" backTo="/app/profile" />

      <form onSubmit={handleSubmit(submit)} noValidate className="px-5 pt-5">
        {formError ? (
          <div role="alert" className="mb-4 flex items-start gap-2 rounded-[10px] bg-[#ffebeb] p-3 text-psm text-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{formError}</span>
          </div>
        ) : null}

        <div className="flex flex-col items-center">
          <div className="relative">
            <Avatar name={user.name} src={avatarPreview} size="xl" className="shadow-card" />
            <span className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-brand-700 text-white shadow">
              <Camera className="h-4 w-4" aria-hidden />
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => fileInput.current?.click()}>
              Change photo
            </Button>
            {avatarPreview ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setAvatarPreview(null)}
                leftIcon={<Trash2 className="h-3.5 w-3.5" />}
              >
                Remove
              </Button>
            ) : null}
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            aria-label="Upload profile photo"
            className="sr-only"
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
          <p className="mt-2 text-caption text-ink-400">JPG or PNG, up to 1 MB.</p>
        </div>

        <Card className="mt-5 space-y-4 shadow-card">
          <Input
            label="Full name"
            autoComplete="name"
            leftIcon={<UserRound className="h-[18px] w-[18px]" />}
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            leftIcon={<Mail className="h-[18px] w-[18px]" />}
            hint="Used for sign-in and monthly receipts."
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Phone number"
            type="tel"
            autoComplete="tel"
            leftIcon={<Phone className="h-[18px] w-[18px]" />}
            error={errors.phone?.message}
            {...register('phone')}
          />
          <Input
            label="Monthly income"
            type="text"
            inputMode="decimal"
            leftIcon={<Wallet className="h-[18px] w-[18px]" />}
            hint="Helps SpendWell suggest a comfortable budget."
            error={errors.monthlyIncome?.message}
            {...register('monthlyIncome')}
          />
        </Card>

        <div className="mt-4 flex items-start gap-3 rounded-card bg-brand-50 p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-brand-700">
            <UserRound className="h-[18px] w-[18px]" aria-hidden />
          </span>
          <p className="text-caption leading-relaxed text-ink-600">
            Your data is stored locally in this demo. In production it is encrypted in transit and at
            rest.
          </p>
        </div>

        <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-t border-grey-100 bg-white/95 px-5 pb-[max(18px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
          <Button type="submit" fullWidth size="lg" loading={isSubmitting || updateProfile.isPending}>
            Save changes
          </Button>
        </div>
      </form>
    </div>
  );
}

export function EditProfile() {
  const { data, isLoading } = useMe();

  if (isLoading || !data) {
    return (
      <div className="min-h-[100dvh]">
        <PageHeader title="Edit profile" backTo="/app/profile" />
        <div className="space-y-4 px-5 pt-5" role="status" aria-label="Loading profile form">
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-9 w-32" />
          </div>
          <Skeleton className="h-[320px] rounded-card" />
        </div>
      </div>
    );
  }

  return <EditProfileForm user={data} />;
}
