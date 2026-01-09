import { useTranslation } from '../../hooks/useTranslation';

interface AIIndicatorProps {
  status?: 'idle' | 'processing' | 'completed' | 'error';
  className?: string;
}

export default function AIIndicator({
  status = 'idle',
  className = '',
}: AIIndicatorProps) {
  const { t } = useTranslation();
  
  const statusConfig = {
    idle: { text: t('ai.ready'), color: 'text-gray-500', dot: 'bg-gray-400' },
    processing: { text: t('ai.processing'), color: 'text-blue-600', dot: 'bg-blue-600 animate-pulse' },
    completed: { text: t('ai.completed'), color: 'text-green-600', dot: 'bg-green-600' },
    error: { text: t('ai.error'), color: 'text-red-600', dot: 'bg-red-600' },
  };

  const config = statusConfig[status];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${config.dot}`} />
      <span className={`text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    </div>
  );
}

