import { useLanguage, type Language } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Languages, Check } from "lucide-react";

export function LanguageSelector() {
  const { language, t, switchLanguage } = useLanguage();
  
  const handleLanguageChange = (newLanguage: Language) => {
    console.log('Switching language from', language, 'to', newLanguage);
    switchLanguage(newLanguage);
  };

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'nl', name: t('dutch'), flag: '🇳🇱' },
    { code: 'en', name: t('english'), flag: '🇺🇸' },
    { code: 'ar', name: t('arabic'), flag: '🇸🇦' },
    { code: 'tr', name: t('turkish'), flag: '🇹🇷' },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center space-x-2">
          <Languages size={16} />
          <span className="hidden sm:inline">{t('language')}</span>
          <span>{languages.find(l => l.code === language)?.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
            </div>
            {language === lang.code && <Check size={16} />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}