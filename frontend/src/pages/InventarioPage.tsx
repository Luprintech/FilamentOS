import { Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { InventoryDashboard } from '@/features/inventory';
import { useAuth } from '@/context/auth-context';
import { PageShell, PageHeader } from '@/components/page-shell';

export function InventarioPage() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();

  return (
    <PageShell>
      <PageHeader
        icon={<Package />}
        badge={t('inventory.badge') ?? t('inventory.title')}
        title={t('inventory.title')}
        subtitle={t('inventory.subtitle')}
      />
      <InventoryDashboard userId={user?.id ?? null} authLoading={authLoading} />
    </PageShell>
  );
}
