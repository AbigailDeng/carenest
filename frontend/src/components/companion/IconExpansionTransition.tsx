import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

interface IconExpansionTransitionProps {
  isExpanding: boolean;
  iconElement: ReactNode | null;
  iconPosition: { x: number; y: number; width: number; height: number } | null;
  panelContent: ReactNode;
  onClose: () => void;
}

export default function IconExpansionTransition({
  isExpanding,
  iconElement,
  iconPosition,
  panelContent,
  onClose,
}: IconExpansionTransitionProps) {
  if (!isExpanding || !iconPosition) {
    return null;
  }

  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  return (
    <AnimatePresence mode="wait">
      {isExpanding && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Expanding icon overlay */}
          <motion.div
            key="icon-expansion"
            initial={{
              x: iconPosition.x + iconPosition.width / 2,
              y: iconPosition.y + iconPosition.height / 2,
              width: iconPosition.width,
              height: iconPosition.height,
              scale: 1,
              opacity: 1,
            }}
            animate={{
              x: centerX,
              y: centerY,
              width: window.innerWidth * 1.2,
              height: window.innerHeight * 1.2,
              scale: 1,
              opacity: 0.8,
            }}
            exit={{
              scale: 0,
              opacity: 0,
            }}
            transition={{
              duration: 0.3,
              ease: 'easeOut',
            }}
            className="absolute flex items-center justify-center"
            style={{
              transform: 'translate(-50%, -50%)',
            }}
          >
            {iconElement}
          </motion.div>

          {/* Full-screen panel sliding up - FR-031E */}
          <motion.div
            key="panel"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              duration: 0.4,
              ease: 'easeOut',
              delay: 0.1,
            }}
            className="absolute inset-0 overflow-y-auto"
            style={{
              background: 'rgba(255, 255, 255, 0.2)', // #ffffff33 equivalent
              backdropFilter: 'blur(15px)',
            }}
          >
            {/* Back button */}
            <motion.button
              onClick={onClose}
              type="button"
              className="fixed top-4 left-4 z-10 w-12 h-12 rounded-full touch-target flex items-center justify-center backdrop-blur-[10px] transition-all"
              style={{
                background: 'rgba(255, 255, 255, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
              }}
              aria-label="Back"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-2xl" style={{ color: '#8B5A7A' }}>
                ←
              </span>
            </motion.button>

            {/* Panel content */}
            <div className="pt-16 pb-24">{panelContent}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
