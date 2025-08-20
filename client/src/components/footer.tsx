import { useLanguage } from "@/lib/i18n";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-gray-200 bg-gray-50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-gray-600">
            © 2025 Career<span className="text-primary">Copilot</span>. {t('allRightsReserved')}.
          </div>
          
          <div className="flex flex-wrap justify-center md:justify-end space-x-6 text-sm">
            <a 
              href="https://www.maptheorie.nl/privacy-policy" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-primary transition-colors"
            >
              {t('privacyPolicy')}
            </a>
            <a 
              href="https://www.maptheorie.nl/terms-of-service" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-primary transition-colors"
            >
              {t('termsOfService')}
            </a>
            <a 
              href="mailto:info@maptheorie.nl"
              className="text-gray-600 hover:text-primary transition-colors"
            >
              {t('support')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}