import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import { Home, Activity, Leaf, Heart, MessageCircle } from 'lucide-react';

interface Tab {
  id: string;
  path: string;
  icon: React.ReactNode; // Changed from string to ReactNode for lucide-react icons
  labelKey: string;
}

const tabs: Tab[] = [
  { id: 'home', path: '/', icon: <Home size={24} />, labelKey: 'tabs.home' },
  { id: 'health', path: '/health', icon: <Activity size={24} />, labelKey: 'tabs.health' },
  { id: 'nutrition', path: '/nutrition', icon: <Leaf size={24} />, labelKey: 'tabs.nutrition' },
  { id: 'emotional', path: '/emotional', icon: <Heart size={24} />, labelKey: 'tabs.emotional' },
  {
    id: 'companion',
    path: '/companion',
    icon: <MessageCircle size={24} />,
    labelKey: 'tabs.companion',
  },
];

export default function BottomTabs() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const [longPressTimer, setLongPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const longPressRef = useRef(false);

  // Determine active tab based on current path
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/') return 'home';
    if (path.startsWith('/companion')) return 'companion';
    if (path.startsWith('/health')) return 'health';
    if (path.startsWith('/nutrition')) return 'nutrition';
    if (path.startsWith('/emotional')) return 'emotional';
    return 'home'; // default to home
  };

  const activeTab = getActiveTab();

  // Handle long press on nutrition tab (500ms)
  const handleNutritionTabPressStart = () => {
    longPressRef.current = false;
    const timer = setTimeout(() => {
      longPressRef.current = true;
      navigate('/nutrition/easter-egg');
    }, 500);
    setLongPressTimer(timer);
  };

  const handleNutritionTabPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    // If not long press, navigate normally
    if (!longPressRef.current) {
      navigate('/nutrition');
    }
    longPressRef.current = false;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom flex justify-center pb-4">
      {/* T087: Floating Bottom Bar - pill-shaped capsule, premium glassmorphism - FR-031A, FR-033 */}
      <div
        className="flex items-center justify-around"
        style={{
          background: 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(30px)',
          borderRadius: '9999px',
          border: '1px solid rgba(255, 255, 255, 0.35)',
          boxShadow: '0 12px 44px rgba(0,0,0,0.16)',
          width: '90vw',
          height: '60px',
          padding: '0 10px',
        }}
      >
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          const isNutrition = tab.id === 'nutrition';

          return (
            <button
              key={tab.id}
              onClick={() => {
                if (!isNutrition) {
                  navigate(tab.path);
                }
              }}
              onMouseDown={isNutrition ? handleNutritionTabPressStart : undefined}
              onMouseUp={isNutrition ? handleNutritionTabPressEnd : undefined}
              onMouseLeave={isNutrition ? handleNutritionTabPressEnd : undefined}
              onTouchStart={isNutrition ? handleNutritionTabPressStart : undefined}
              onTouchEnd={isNutrition ? handleNutritionTabPressEnd : undefined}
              className={`
                flex flex-col items-center justify-center
                transition-all duration-300 rounded-xl mx-1
                min-w-[44px] min-h-[44px]
                ${isActive ? 'bg-white/30' : ''}
              `}
              style={{
                color: '#FF7E9D', // Deep pink for icons - FR-033
                opacity: isActive ? 1 : 0.7,
              }}
              aria-label={t(tab.labelKey)}
            >
              <span style={{ color: '#FF7E9D' }}>{tab.icon}</span>
              {/* Remove text labels or use smaller lighter font - FR-031A */}
              {/* <span className="text-[10px] font-light" style={{ fontFamily: 'Montserrat, PingFang Light, sans-serif' }}>
                {t(tab.labelKey)}
              </span> */}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
