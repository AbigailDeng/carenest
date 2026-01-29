import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';

interface DisclaimerProps {
  type?: 'medical' | 'ai' | 'general';
  children?: React.ReactNode;
  className?: string;
}

export default function Disclaimer({
  type = 'general',
  children,
  className = '',
}: DisclaimerProps) {
  const { t } = useTranslation();
  const text = children || t(`disclaimer.${type}`);

  return (
    <div className={`text-xs text-gray-600 italic ${className}`}>
      <span className="font-semibold">{t('disclaimer.note')} </span>
      {text}
    </div>
  );
}

