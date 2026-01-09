import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';

interface Tab {
  id: string;
  path: string;
  icon: string;
  labelKey: string;
}

const tabs: Tab[] = [
  { id: 'health', path: '/health', icon: '💊', labelKey: 'tabs.health' },
  { id: 'nutrition', path: '/nutrition', icon: '🍎', labelKey: 'tabs.nutrition' },
  { id: 'emotional', path: '/emotional', icon: '💝', labelKey: 'tabs.emotional' },
];

export default function BottomTabs() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const longPressRef = useRef(false);

  // Determine active tab based on current path
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.startsWith('/health')) return 'health';
    if (path.startsWith('/nutrition')) return 'nutrition';
    if (path.startsWith('/emotional')) return 'emotional';
    return 'health'; // default
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom px-2 pb-2">
      <div className="max-w-md mx-auto clay-extrude bg-white rounded-t-[20px] rounded-b-[20px]">
        <div className="flex items-center justify-around h-20">
          {tabs.map((tab) => {
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
                  flex flex-col items-center justify-center flex-1 h-full
                  transition-all duration-300 rounded-[18px] mx-1
                  ${isActive 
                    ? 'bg-clay-primary text-white shadow-clay' 
                    : 'text-clay-textDim hover:bg-clay-lavender'
                  }
                `}
                aria-label={t(tab.labelKey)}
              >
                <span className="text-2xl mb-1">{tab.icon}</span>
                <span className={`text-xs font-body ${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {t(tab.labelKey)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

