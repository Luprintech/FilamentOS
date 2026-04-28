import { motion } from 'framer-motion';
import { InventoryDashboard } from '@/features/inventory';
import { useAuth } from '@/context/auth-context';

export function InventarioPage() {
  const { user, loading: authLoading } = useAuth();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-[32px] border border-border/70 bg-card/60 backdrop-blur-md p-5 shadow-[0_18px_40px_rgba(2,8,23,0.10)] dark:border-white/10 dark:shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-6"
    >
      <InventoryDashboard userId={user?.id ?? null} authLoading={authLoading} />
    </motion.div>
  );
}
