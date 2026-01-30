import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose?: () => void;
}

export default function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onClose?.();
      }, 300); // Wait for exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'linear-gradient(90deg, rgba(34, 197, 94, 0.9) 0%, rgba(16, 185, 129, 0.85) 100%)';
      case 'error':
        return 'linear-gradient(90deg, rgba(239, 68, 68, 0.9) 0%, rgba(220, 38, 38, 0.85) 100%)';
      case 'info':
        return 'linear-gradient(90deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.85) 100%)';
      default:
        return 'linear-gradient(90deg, rgba(34, 197, 94, 0.9) 0%, rgba(16, 185, 129, 0.85) 100%)';
    }
  };

  const getTextColor = () => {
    return '#FFFFFF';
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[200] px-6 py-3 rounded-2xl shadow-lg"
          style={{
            background: getBackgroundColor(),
            color: getTextColor(),
            border: '1px solid rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(10px)',
            minWidth: '200px',
            maxWidth: '90%',
            textAlign: 'center',
          }}
        >
          <p className="text-sm font-semibold" style={{ color: getTextColor() }}>
            {message}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
