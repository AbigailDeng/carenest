import { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar, HeartPulse, Leaf, Utensils } from 'lucide-react';
import { motion } from 'framer-motion';
import ErrorBoundary from './ErrorBoundary';
import SettingsDrawer from './SettingsDrawer';
import { useOffline } from '../../hooks/useOffline';
import { useTranslation } from '../../hooks/useTranslation';
import FloatingParticles from '../companion/FloatingParticles';
import ImageBackground from '../shared/ImageBackground';
import CharacterAvatar from '../companion/CharacterAvatar';
import { useCompanion } from '../../hooks/useCompanion';
import HealthUploadScreen from '../health/HealthUploadScreen';
import LifestyleSuggestionsScreen from '../health/LifestyleSuggestionsScreen';
import SymptomLogScreen from '../health/SymptomLogScreen';
import SymptomAnalysisScreen from '../health/SymptomAnalysisScreen';
import HealthTimelineScreen from '../health/HealthTimelineScreen';
import HealthCalendarScreen from '../health/HealthCalendarScreen';
import FoodReflectionScreen from '../nutrition/FoodReflectionScreen';
import NutritionReflectionDetailScreen from '../nutrition/NutritionReflectionDetailScreen';
import NutritionInputScreen from '../nutrition/NutritionInputScreen';
import MealSuggestionsScreen from '../nutrition/MealSuggestionsScreen';
import NutritionCalendarScreen from '../nutrition/NutritionCalendarScreen';
import NutritionTimelineScreen from '../nutrition/NutritionTimelineScreen';
import SugarReductionEasterEgg from '../nutrition/SugarReductionEasterEgg';
import PrivacySettingsScreen from '../privacy/PrivacySettingsScreen';
import DataViewScreen from '../privacy/DataViewScreen';
import DataExportScreen from '../privacy/DataExportScreen';
import DataDeletionScreen from '../privacy/DataDeletionScreen';
import CompanionScreen from '../companion/CompanionScreen';
import HomeScreen from '../companion/HomeScreen';

function Layout() {
  const isOffline = useOffline();
  const { t } = useTranslation();
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Close drawer handler
  const handleCloseDrawer = () => {
    setSettingsOpen(false);
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'transparent' }}>
        {/* Offline indicator */}
        {isOffline && (
          <div className="bg-clay-warning rounded-b-[20px] px-4 py-3 text-center text-sm text-white font-body shadow-clay">
            {t('offline.message')}
          </div>
        )}

        {/* Main content area */}
        <main className="flex-1 w-full overflow-hidden" style={{ backgroundColor: 'transparent' }}>
          <Routes>
            {/* Home screen with character and entry cards */}
            <Route path="/" element={<HomeScreen />} />

            {/* Health routes */}
            <Route path="/health" element={<HealthHomeScreen />} />
            <Route path="/health/upload" element={<HealthUploadScreen />} />
            <Route path="/health/lifestyle/:recordId" element={<LifestyleSuggestionsScreen />} />
            <Route path="/health/symptoms" element={<SymptomLogScreen />} />
            <Route path="/health/symptoms/edit/:id" element={<SymptomLogScreen />} />
            <Route path="/health/symptoms/:id" element={<SymptomAnalysisScreen />} />
            <Route path="/health/timeline" element={<HealthTimelineScreen />} />
            <Route path="/health/calendar" element={<HealthCalendarScreen />} />

            {/* Nutrition routes */}
            <Route path="/nutrition" element={<NutritionHomeScreen />} />
            <Route path="/nutrition/reflection" element={<FoodReflectionScreen />} />
            <Route path="/nutrition/reflection/:id" element={<NutritionReflectionDetailScreen />} />
            <Route path="/nutrition/calendar" element={<NutritionCalendarScreen />} />
            <Route path="/nutrition/timeline" element={<NutritionTimelineScreen />} />
            <Route path="/nutrition/input" element={<NutritionInputScreen />} />
            <Route path="/nutrition/suggestions" element={<MealSuggestionsScreen />} />
            <Route path="/nutrition/easter-egg" element={<SugarReductionEasterEgg />} />

            {/* Emotional routes */}
            <Route path="/emotional" element={<EmotionalHomeScreen />} />

            {/* Companion routes */}
            <Route path="/companion" element={<CompanionScreen />} />

            {/* Privacy routes (handled in drawer) */}
            <Route path="/privacy" element={<PrivacySettingsScreen />} />
            <Route path="/privacy/view" element={<DataViewScreen />} />
            <Route path="/privacy/export" element={<DataExportScreen />} />
            <Route path="/privacy/delete" element={<DataDeletionScreen />} />
          </Routes>
        </main>

        {/* Settings drawer */}
        <SettingsDrawer isOpen={settingsOpen} onClose={handleCloseDrawer} />
      </div>
    </ErrorBoundary>
  );
}

function HealthHomeScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Ref: FR-030B (enhanced) + user request: higher-end glass
  const GLASS_BG = 'rgba(255, 255, 255, 0.2)';
  const GLASS_BLUR = 'blur(35px)';

  // Narrower cards + more breathing room (avoid mutual blocking on small screens)
  const CARD_LEFT = '14%';
  const CARD_WIDTH = '72%'; // MUST not overflow
  const CARD_MAX_WIDTH_PX = 340;
  const CARD_HEIGHT_PX = 104;
  const CARD_RADIUS_PX = 18;

  // Centralized absolute stacking (NOT a vertical list)
  const cards = [
    {
      id: 'folder-symptoms',
      label: t('health.logSymptoms'),
      route: '/health/symptoms',
      icon: HeartPulse,
      rotate: 4,
      bottom: '6%',
      zIndex: 2,
      floatDelay: 0.2,
      floatDuration: 5.1,
    },
    {
      id: 'folder-timeline',
      label: t('health.viewTimeline'),
      route: '/health/timeline?view=calendar',
      icon: Calendar,
      rotate: -3,
      bottom: '18%',
      zIndex: 1,
      floatDelay: 0.4,
      floatDuration: 6.0,
    },
  ];

  // Handle card click with spring animation - FR-035(5)
  const handleCardClick = (route: string) => {
    // Navigation happens after animation completes
    setTimeout(() => {
      navigate(route);
    }, 400);
  };

  // Background image URL - use specified character illustration
  const HOME_SCREEN_BACKGROUND_URL =
    '/images/1cb7398bea6d251b67d50b965c4295130983e2771863c5-oVQb7P_fw658webp.webp';

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '100vh',
        margin: 0,
        padding: 0,
      }}
    >
      {/* ImageBackground - 最底层唯一的白起立绘 */}
      <ImageBackground imageUrl={HOME_SCREEN_BACKGROUND_URL} />

      {/* Floating Particles - FR-036(1) */}
      <div className="absolute inset-0" style={{ zIndex: 2 }}>
        <FloatingParticles count={20} />
      </div>

      {/* Large-sized back button - top-left corner - FR-035(7) & FR-036(4) */}
      <motion.button
        onClick={() => navigate('/')}
        className="fixed top-5 left-5 z-50 rounded-full flex items-center justify-center transition-all duration-200 touch-target"
        style={{
          width: '56px',
          height: '56px',
          background: 'rgba(255, 255, 255, 0.15)', // More subtle glassmorphism - FR-036(4)
          backdropFilter: 'blur(20px)', // Reduced blur - FR-036(4)
          border: '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 4px 24px rgba(255, 255, 255, 0.2)',
          color: '#4A4A4A',
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={t('common.back')}
      >
        <ChevronLeft size={28} strokeWidth={2} />
      </motion.button>

      {/* Staggered floating folders (NOT a list): absolute stacking, overlap, no overflow */}
      <div className="fixed inset-0 z-30" style={{ pointerEvents: 'none' }}>
        <div className="relative w-full h-full">
          {cards.map(card => {
            const IconComponent = card.icon;
            return (
              <motion.div
                key={card.id}
                className="touch-target"
                style={{
                  pointerEvents: 'auto',
                  cursor: 'pointer',
                  position: 'absolute',
                  left: CARD_LEFT,
                  width: CARD_WIDTH,
                  bottom: card.bottom,
                  zIndex: card.zIndex,
                  maxWidth: `${CARD_MAX_WIDTH_PX}px`,
                  height: `${CARD_HEIGHT_PX}px`,
                  background: GLASS_BG,
                  backdropFilter: GLASS_BLUR,
                  // Inner glow stroke (no heavy/dark shadow)
                  border: '1px solid rgba(255, 255, 255, 0.6)',
                  borderRadius: `${CARD_RADIUS_PX}px`,
                  boxShadow:
                    '0 0 0 1px rgba(255, 255, 255, 0.28) inset, 0 16px 44px rgba(255, 255, 255, 0.18)',
                  overflow: 'hidden',
                  willChange: 'transform',
                  rotate: card.rotate,
                }}
                initial={false} // persistent buttons (never disappear)
                animate={{
                  y: [0, -5, 0, 5, 0], // independent floating (±5px)
                }}
                transition={{
                  delay: card.floatDelay,
                  duration: card.floatDuration,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                whileHover={{ scale: 1.015 }}
                whileTap={{
                  y: -14,
                  scale: 1.05,
                  transition: {
                    type: 'spring',
                    stiffness: 300,
                    damping: 25,
                    duration: 0.4,
                  },
                }}
                onClick={() => handleCardClick(card.route)}
              >
                {/* Subtle folder tab (no dark shadow) */}
                <div
                  style={{
                    width: '100%',
                    height: '26px',
                    background: 'rgba(255, 255, 255, 0.12)',
                    backdropFilter: GLASS_BLUR,
                    borderTopLeftRadius: `${CARD_RADIUS_PX}px`,
                    borderTopRightRadius: `${CARD_RADIUS_PX}px`,
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: '14px',
                      top: '8px',
                      width: '64px',
                      height: '10px',
                      background: 'rgba(255, 255, 255, 0.16)',
                      borderRadius: '10px',
                    }}
                  />
                </div>

                {/* Folder content */}
                <div className="h-[calc(100%-26px)] px-4 py-3 flex items-center justify-center gap-3">
                  <IconComponent
                    size={34}
                    strokeWidth={1.75}
                    style={{ color: '#FF7E9D', fill: 'none' }}
                  />
                  <span
                    className="text-base font-semibold text-center leading-snug"
                    style={{ color: '#4A4A4A' }}
                  >
                    {card.label}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Companion dialogue bubble above cards - positioned to avoid blocking character face */}
      <div
        className="fixed left-1/2 transform -translate-x-1/2 z-40"
        style={{
          top: '36%', // Move down per request
        }}
      >
        <div
          className="px-4 py-3"
          style={{
            maxWidth: '300px',
            background: GLASS_BG,
            backdropFilter: GLASS_BLUR,
            border: '1px solid rgba(255, 255, 255, 0.75)',
            borderRadius: '18px',
            boxShadow: '0 10px 28px rgba(255, 255, 255, 0.22)',
          }}
        >
          <p className="text-sm leading-relaxed text-center font-bold" style={{ color: '#4A4A4A' }}>
            {t('health.ledgerPrompt') || '这是我为你整理的记录，想先看哪一部分？'}
          </p>
        </div>
      </div>
    </div>
  );
}

function NutritionHomeScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { characterState } = useCompanion('baiqi');

  // Ref: FR-030B (enhanced) + user request: higher-end glass
  const GLASS_BG = 'rgba(255, 255, 255, 0.2)';
  const GLASS_BLUR = 'blur(35px)';

  // Narrower cards + more breathing room (avoid mutual blocking on small screens)
  const CARD_LEFT = '14%';
  const CARD_WIDTH = '72%'; // MUST not overflow
  const CARD_MAX_WIDTH_PX = 340;
  const CARD_HEIGHT_PX = 104;
  const CARD_RADIUS_PX = 18;

  // Centralized absolute stacking (NOT a vertical list)
  const cards = [
    {
      id: 'folder-reflection',
      label: t('nutrition.record.title'),
      route: '/nutrition/reflection',
      icon: Utensils,
      rotate: 4,
      bottom: '6%',
      zIndex: 3,
      floatDelay: 0.2,
      floatDuration: 5.1,
    },
    {
      id: 'folder-timeline',
      label: t('nutrition.viewTimeline'),
      route: '/nutrition/timeline',
      icon: Calendar,
      rotate: -2,
      bottom: '18%',
      zIndex: 2,
      floatDelay: 0.3,
      floatDuration: 5.5,
    },
    {
      id: 'folder-input',
      label: t('nutrition.input.title'),
      route: '/nutrition/input',
      icon: Leaf,
      rotate: -3,
      bottom: '30%',
      zIndex: 1,
      floatDelay: 0.4,
      floatDuration: 6.0,
    },
  ];

  // Handle card click with spring animation - FR-035(5)
  const handleCardClick = (route: string) => {
    // Navigation happens after animation completes
    setTimeout(() => {
      navigate(route);
    }, 400);
  };

  // Background image URL - use DIFFERENT character illustration for nutrition page
  const NUTRITION_BACKGROUND_URL = '/images/008fP45sly1hreaeb88b2j323s35s1l1.jpg';

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '100vh',
        margin: 0,
        padding: 0,
      }}
    >
      {/* ImageBackground - 最底层唯一的白起立绘 (nutrition-specific) */}
      <ImageBackground imageUrl={NUTRITION_BACKGROUND_URL} />

      {/* Floating Particles - FR-036(1) */}
      <div className="absolute inset-0" style={{ zIndex: 2 }}>
        <FloatingParticles count={20} />
      </div>

      {/* Large-sized back button - top-left corner - FR-035(7) & FR-036(4) */}
      <motion.button
        onClick={() => navigate('/')}
        className="fixed top-5 left-5 z-50 rounded-full flex items-center justify-center transition-all duration-200 touch-target"
        style={{
          width: '56px',
          height: '56px',
          background: 'rgba(255, 255, 255, 0.15)', // More subtle glassmorphism - FR-036(4)
          backdropFilter: 'blur(20px)', // Reduced blur - FR-036(4)
          border: '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 4px 24px rgba(255, 255, 255, 0.2)',
          color: '#4A4A4A',
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={t('common.back')}
      >
        <ChevronLeft size={28} strokeWidth={2} />
      </motion.button>

      {/* Staggered floating folders (NOT a list): absolute stacking, overlap, no overflow */}
      <div className="fixed inset-0 z-30" style={{ pointerEvents: 'none' }}>
        <div className="relative w-full h-full">
          {cards.map(card => {
            const IconComponent = card.icon;
            return (
              <motion.div
                key={card.id}
                className="touch-target"
                style={{
                  pointerEvents: 'auto',
                  cursor: 'pointer',
                  position: 'absolute',
                  left: CARD_LEFT,
                  width: CARD_WIDTH,
                  bottom: card.bottom,
                  zIndex: card.zIndex,
                  maxWidth: `${CARD_MAX_WIDTH_PX}px`,
                  height: `${CARD_HEIGHT_PX}px`,
                  background: GLASS_BG,
                  backdropFilter: GLASS_BLUR,
                  // Inner glow stroke (no heavy/dark shadow)
                  border: '1px solid rgba(255, 255, 255, 0.6)',
                  borderRadius: `${CARD_RADIUS_PX}px`,
                  boxShadow:
                    '0 0 0 1px rgba(255, 255, 255, 0.28) inset, 0 16px 44px rgba(255, 255, 255, 0.18)',
                  overflow: 'hidden',
                  willChange: 'transform',
                  rotate: card.rotate,
                }}
                initial={false} // persistent buttons (never disappear)
                animate={{
                  y: [0, -5, 0, 5, 0], // independent floating (±5px)
                }}
                transition={{
                  delay: card.floatDelay,
                  duration: card.floatDuration,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                whileHover={{ scale: 1.015 }}
                whileTap={{
                  y: -14,
                  scale: 1.05,
                  transition: {
                    type: 'spring',
                    stiffness: 300,
                    damping: 25,
                    duration: 0.4,
                  },
                }}
                onClick={() => handleCardClick(card.route)}
              >
                {/* Subtle folder tab (no dark shadow) */}
                <div
                  style={{
                    width: '100%',
                    height: '26px',
                    background: 'rgba(255, 255, 255, 0.12)',
                    backdropFilter: GLASS_BLUR,
                    borderTopLeftRadius: `${CARD_RADIUS_PX}px`,
                    borderTopRightRadius: `${CARD_RADIUS_PX}px`,
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: '14px',
                      top: '8px',
                      width: '64px',
                      height: '10px',
                      background: 'rgba(255, 255, 255, 0.16)',
                      borderRadius: '10px',
                    }}
                  />
                </div>

                {/* Folder content */}
                <div className="h-[calc(100%-26px)] px-4 py-3 flex items-center justify-center gap-3">
                  <IconComponent
                    size={34}
                    strokeWidth={1.75}
                    style={{ color: '#FF7E9D', fill: 'none' }}
                  />
                  <span
                    className="text-base font-semibold text-center leading-snug"
                    style={{ color: '#4A4A4A' }}
                  >
                    {card.label}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Companion dialogue bubble above cards - positioned to avoid blocking character face */}
      <div
        className="fixed left-1/2 transform -translate-x-1/2 z-40"
        style={{
          top: '36%', // Move down per request
        }}
      >
        <div
          className="px-4 py-3 flex items-start gap-2"
          style={{
            maxWidth: '300px',
            background: GLASS_BG,
            backdropFilter: GLASS_BLUR,
            border: '1px solid rgba(255, 255, 255, 0.75)',
            borderRadius: '18px',
            boxShadow: '0 10px 28px rgba(255, 255, 255, 0.22)',
          }}
        >
          <CharacterAvatar
            characterId="baiqi"
            characterState={characterState}
            size="sm"
            showBadge={false}
          />
          <p className="text-sm leading-relaxed font-bold flex-1" style={{ color: '#4A4A4A' }}>
            {t('nutrition.ledgerPrompt') || '这是我为你整理的营养记录，想先看哪一部分？'}
          </p>
        </div>
      </div>
    </div>
  );
}

function EmotionalHomeScreen() {
  const { t } = useTranslation();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-heading text-clay-text mb-6">{t('home.emotionalSupport')}</h1>
      <p className="text-clay-textDim font-body text-lg mb-6">{t('home.subtitle')}</p>
      <div className="p-8 text-center text-clay-textDim clay-card bg-clay-lavender">
        <p className="text-5xl mb-3">💕</p>
        <p className="font-body text-lg">{t('app.comingSoon')}</p>
      </div>
    </div>
  );
}

export default Layout;
