import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../../hooks/useTranslation';
import { Activity, Leaf, Heart, Settings } from 'lucide-react';

interface RadialMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onIconClick: (module: 'health' | 'nutrition' | 'emotion' | 'settings') => void;
  clickPosition: { x: number; y: number } | null;
}

interface MenuIcon {
  id: 'health' | 'nutrition' | 'emotion' | 'settings';
  icon: React.ReactNode; // Changed from string to ReactNode for lucide-react icons
  label: string;
  position: { x: number; y: number }; // Relative position from center (0-1)
}

export default function RadialMenu({
  isOpen,
  onClose,
  onIconClick,
  clickPosition,
}: RadialMenuProps) {
  const { t } = useTranslation();

  // Calculate icon positions relative to click point
  // Health → top-left, Nutrition → top-right, Emotion → bottom-left, Settings → bottom-right
  const iconRadius = 120; // Distance from center in pixels
  const icons: MenuIcon[] = [
    {
      id: 'health',
      icon: <Activity size={24} />,
      label: t('tabs.health'),
      position: { x: -0.7, y: -0.7 }, // Top-left
    },
    {
      id: 'nutrition',
      icon: <Leaf size={24} />,
      label: t('tabs.nutrition'),
      position: { x: 0.7, y: -0.7 }, // Top-right
    },
    {
      id: 'emotion',
      icon: <Heart size={24} />,
      label: t('tabs.emotional'),
      position: { x: -0.7, y: 0.7 }, // Bottom-left
    },
    {
      id: 'settings',
      icon: <Settings size={24} />,
      label: t('settings.title') || 'Settings',
      position: { x: 0.7, y: 0.7 }, // Bottom-right
    },
  ];

  // Calculate absolute positions based on click position
  const getIconPosition = (icon: MenuIcon) => {
    if (!clickPosition) {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      return {
        x: centerX + icon.position.x * iconRadius,
        y: centerY + icon.position.y * iconRadius,
      };
    }

    const x = clickPosition.x + icon.position.x * iconRadius;
    const y = clickPosition.y + icon.position.y * iconRadius;

    return { x, y };
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Background overlay - click to dismiss */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40"
            onClick={onClose}
            style={{
              backdropFilter: 'blur(5px)',
              background: 'rgba(0, 0, 0, 0.1)',
            }}
          />

          {/* Radial menu icons */}
          {icons.map((icon, index) => {
            const position = getIconPosition(icon);
            const startX = clickPosition?.x || window.innerWidth / 2;
            const startY = clickPosition?.y || window.innerHeight / 2;

            return (
              <motion.button
                key={icon.id}
                initial={{
                  scale: 0,
                  opacity: 0,
                  x: startX,
                  y: startY,
                }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  x: position.x,
                  y: position.y,
                }}
                exit={{
                  scale: 0,
                  opacity: 0,
                  x: startX,
                  y: startY,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                  delay: index * 0.05,
                }}
                onClick={e => {
                  e.stopPropagation();
                  onIconClick(icon.id);
                }}
                className="fixed z-50 w-16 h-16 rounded-full touch-target flex items-center justify-center"
                style={{
                  left: `${position.x}px`,
                  top: `${position.y}px`,
                  transform: 'translate(-50%, -50%)',
                  // T023: Premium glassmorphism styling - FR-031D, FR-030B
                  background: 'rgba(255, 255, 255, 0.15)', // Extremely transparent white
                  backdropFilter: 'blur(25px)', // Strong blur effect
                  border: '1px solid rgba(255, 255, 255, 0.4)', // Subtle bright border
                  boxShadow: '0 4px 24px rgba(255, 255, 255, 0.2)', // Soft white outer glow
                  color: '#FF7E9D', // Deep pink for icons
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative z-10" style={{ color: '#FF7E9D' }}>
                  {icon.icon}
                </span>
              </motion.button>
            );
          })}
        </>
      )}
    </AnimatePresence>
  );
}
