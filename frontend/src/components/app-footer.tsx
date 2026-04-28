import { Youtube, Instagram } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TikTokIcon } from '@/components/icons';
import { PrivacyPolicyModal } from '@/components/privacy-policy-modal';
import { BuyMeCoffeeButton } from '@/components/buy-me-coffee-button';

export function AppFooter() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-6 text-center text-sm text-muted-foreground print:hidden mt-12">

      {/* Soporte centralizado */}
      <div className="mb-5 space-y-1">
        <p className="font-semibold text-foreground/80">
          {t('footer_support_title')}
        </p>
        <p className="text-xs">
          {t('footer_support_subtitle')}
        </p>
        <p className="text-xs">
          {t('footer_support_fallback')}{' '}
          <a href="mailto:luprintech@gmail.com" className="text-primary hover:underline">
            luprintech@gmail.com
          </a>
        </p>
      </div>

      {/* Redes sociales */}
      <div className="flex justify-center gap-6 mb-4">
        <a href="https://www.youtube.com/@Luprintech" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="hover:text-primary transition-colors">
          <Youtube className="h-5 w-5" />
        </a>
        <a href="https://www.instagram.com/luprintech/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-primary transition-colors">
          <Instagram className="h-5 w-5" />
        </a>
        <a href="https://www.tiktok.com/@luprintech" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="hover:text-primary transition-colors">
          <TikTokIcon className="h-5 w-5" />
        </a>
      </div>

      <p className="mb-2">{t('footer_copyright', { year: currentYear })}</p>
      <p>
        <PrivacyPolicyModal
          trigger={
            <button className="text-primary hover:underline underline-offset-2 transition-colors">
              {t('footer_privacy')}
            </button>
          }
        />
      </p>

      <div className="mt-4 border-t border-[#8b5cf6]/15 pt-4">
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-gray-400">¿Te es útil FilamentOS? Puedes invitarme a un café</p>
          <BuyMeCoffeeButton size="md" />
        </div>
      </div>
    </footer>
  );
}
