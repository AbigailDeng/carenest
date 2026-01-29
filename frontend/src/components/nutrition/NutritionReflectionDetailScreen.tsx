import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Lightbulb, CheckSquare, AlertCircle, Heart } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useTranslation } from '../../hooks/useTranslation';
import { FoodReflection } from '../../types';
import { getEntity } from '../../services/storage/indexedDB';
import AIIndicator from '../shared/AIIndicator';
import ImageBackground from '../shared/ImageBackground';
import FloatingParticles from '../companion/FloatingParticles';

export default function NutritionReflectionDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [reflection, setReflection] = useState<FoodReflection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Background image URL - nutrition-specific character illustration
  const BACKGROUND_IMAGE_URL = '/images/008fP45sly1hreaeb88b2j323s35s1l1.jpg';

  // Card styling - solid background for better readability (same as SymptomAnalysisScreen)
  const CARD_BG = 'rgba(255, 255, 255, 0.95)'; // High opacity white background for readability
  const CARD_BORDER = '1px solid rgba(0, 0, 0, 0.1)'; // Subtle border
  const CARD_SHADOW = '0 2px 8px rgba(0, 0, 0, 0.1)'; // Subtle shadow

  // Load FoodReflection by ID
  useEffect(() => {
    const loadReflection = async () => {
      if (!id) {
        setError('No ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const loadedReflection = await getEntity<FoodReflection>('foodReflections', id);
        if (!loadedReflection) {
          setError('Record not found');
        } else {
          setReflection(loadedReflection);
        }
      } catch (err: any) {
        console.error('[NutritionReflectionDetail] Error loading reflection:', err);
        setError(err.message || 'Failed to load record');
      } finally {
        setLoading(false);
      }
    };

    loadReflection();
  }, [id]);

  // Helper function to get meal type display name
  const getMealTypeDisplay = (mealType: string): string => {
    const mealTypeMap: Record<string, string> = {
      breakfast: t('nutrition.record.mealType.breakfast') || '早餐',
      lunch: t('nutrition.record.mealType.lunch') || '午餐',
      dinner: t('nutrition.record.mealType.dinner') || '晚餐',
      snack: t('nutrition.record.mealType.snack') || '夜宵',
    };
    return mealTypeMap[mealType] || mealType;
  };

  // Helper function to get reflection type display name
  const getReflectionTypeDisplay = (reflectionType: string): string => {
    const reflectionTypeMap: Record<string, string> = {
      light: t('nutrition.reflection.light') || '清淡',
      normal: t('nutrition.reflection.normal') || '正常',
      indulgent: t('nutrition.reflection.indulgent') || '放纵',
    };
    return reflectionTypeMap[reflectionType] || reflectionType;
  };

  if (loading) {
    return (
      <div
        className="relative min-h-screen"
        style={{
          backgroundColor: 'transparent',
          position: 'relative',
          width: '100%',
          height: '100%',
          minHeight: '100vh',
          margin: 0,
          padding: 0,
        }}
      >
        {/* ImageBackground - nutrition-specific character illustration */}
        <ImageBackground imageUrl={BACKGROUND_IMAGE_URL} />
        <div
          className="relative flex items-center justify-center z-10"
          style={{ minHeight: '100vh' }}
        >
          <div className="text-center">
            <p className="text-gray-600" style={{ color: '#2A2A2A' }}>
              {t('common.loading')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !reflection) {
    return (
      <div
        className="relative min-h-screen"
        style={{
          backgroundColor: 'transparent',
          position: 'relative',
          width: '100%',
          height: '100%',
          minHeight: '100vh',
          margin: 0,
          padding: 0,
        }}
      >
        {/* ImageBackground - nutrition-specific character illustration */}
        <ImageBackground imageUrl={BACKGROUND_IMAGE_URL} />
        <div
          className="relative min-h-screen py-6 z-10 w-full"
          style={{ backgroundColor: 'transparent', paddingLeft: '20px', paddingRight: '20px' }}
        >
          <div
            className="p-5 rounded-2xl w-full"
            style={{
              background: CARD_BG,
              border: CARD_BORDER,
              boxShadow: CARD_SHADOW,
            }}
          >
            <p className="mb-4" style={{ color: '#2A2A2A' }}>
              {error || t('nutrition.reflection.notFound') || '记录未找到'}
            </p>
            <button
              onClick={() => navigate('/nutrition/timeline')}
              className="px-4 py-2 rounded-xl font-medium transition-all"
              style={{
                background: CARD_BG,
                border: CARD_BORDER,
                boxShadow: CARD_SHADOW,
                color: '#2A2A2A',
              }}
            >
              {t('nutrition.backToTimeline') || '返回时间线'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { aiAnalysis, processingStatus, errorMessage } = reflection;

  return (
    <div
      className="relative min-h-screen"
      style={{
        backgroundColor: 'transparent',
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '100vh',
        margin: 0,
        padding: 0,
      }}
    >
      {/* ImageBackground - nutrition-specific character illustration */}
      <ImageBackground imageUrl={BACKGROUND_IMAGE_URL} />

      {/* Floating Particles */}
      <div className="absolute inset-0" style={{ zIndex: 2, pointerEvents: 'none' }}>
        <FloatingParticles count={20} />
      </div>

      {/* Content Layer - all containers must be transparent, scrollable */}
      <div
        className="relative min-h-screen overflow-y-auto w-full"
        style={{
          backgroundColor: 'transparent',
          zIndex: 1,
          margin: 0,
          padding: 0,
          position: 'relative',
        }}
      >
        {/* Top Header - fixed at top layer */}
        <div
          className="fixed top-0 left-0 right-0 z-[100] py-4 w-full"
          style={{
            backgroundColor: 'transparent',
            paddingLeft: '20px',
            paddingRight: '20px',
            paddingTop: `calc(env(safe-area-inset-top) + 16px)`,
            pointerEvents: 'auto',
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                navigate('/nutrition/timeline');
              }}
              className="rounded-full flex items-center justify-center transition-all duration-200 touch-target"
              style={{
                width: '44px',
                height: '44px',
                background: CARD_BG,
                border: CARD_BORDER,
                boxShadow: CARD_SHADOW,
                color: '#2A2A2A',
                cursor: 'pointer',
                pointerEvents: 'auto',
                zIndex: 101,
              }}
              aria-label={t('common.back')}
            >
              <ChevronLeft size={24} strokeWidth={2} />
            </button>
            <h1 className="text-xl font-bold" style={{ color: '#FFFFFF' }}>
              {t('nutrition.reflection.detailTitle') || '饮食记录详情'}
            </h1>
          </div>
        </div>

        {/* Main content area - cards with solid background for readability */}
        <div
          className="relative w-full"
          style={{
            backgroundColor: 'transparent',
            paddingTop: '80px',
            paddingBottom: '100px',
            paddingLeft: '20px',
            paddingRight: '20px',
            minHeight: '100vh',
          }}
        >
          <div className="w-full space-y-4">
            {/* Record Summary Card */}
            <div
              className="p-5 rounded-2xl"
              style={{
                background: CARD_BG,
                border: CARD_BORDER,
                boxShadow: CARD_SHADOW,
                borderRadius: '16px',
              }}
            >
              <h2 className="text-lg font-bold mb-3" style={{ color: '#2A2A2A' }}>
                {t('nutrition.reflection.recordSummary') || '记录摘要'}
              </h2>
              <div className="space-y-2">
                <p className="text-sm" style={{ color: '#2A2A2A', opacity: 0.8 }}>
                  <span className="font-medium">{t('nutrition.reflection.date') || '日期'}: </span>
                  {format(parseISO(reflection.date + 'T00:00:00'), 'yyyy-MM-dd')}
                </p>
                <p className="text-sm" style={{ color: '#2A2A2A', opacity: 0.8 }}>
                  <span className="font-medium">
                    {t('nutrition.reflection.mealType') || '餐次'}:{' '}
                  </span>
                  {getMealTypeDisplay(reflection.mealType)}
                </p>
                <p className="text-sm" style={{ color: '#2A2A2A', opacity: 0.8 }}>
                  <span className="font-medium">{t('nutrition.reflection.type') || '类型'}: </span>
                  {getReflectionTypeDisplay(reflection.reflection)}
                </p>
                {reflection.notes && (
                  <p className="text-sm mt-3" style={{ color: '#2A2A2A' }}>
                    <span className="font-medium">
                      {t('nutrition.reflection.notes') || '备注'}:{' '}
                    </span>
                    {reflection.notes}
                  </p>
                )}
                <p className="text-xs mt-3" style={{ color: '#2A2A2A', opacity: 0.6 }}>
                  {t('nutrition.reflection.processingStatusLabel') || '处理状态'}:{' '}
                  {t(`nutrition.reflection.processingStatus.${processingStatus}`) ||
                    processingStatus}
                </p>
              </div>
            </div>

            {/* Processing Status */}
            {processingStatus === 'pending' && (
              <div
                className="p-5 rounded-2xl"
                style={{
                  background: 'rgba(255, 243, 205, 0.95)',
                  border: '1px solid rgba(255, 200, 87, 0.3)',
                  boxShadow: CARD_SHADOW,
                  borderRadius: '16px',
                }}
              >
                <p className="text-sm" style={{ color: '#2A2A2A' }}>
                  {t('nutrition.reflection.pendingAnalysis') || '等待分析中...'}
                </p>
              </div>
            )}

            {processingStatus === 'processing' && (
              <div
                className="p-5 rounded-2xl"
                style={{
                  background: CARD_BG,
                  border: CARD_BORDER,
                  boxShadow: CARD_SHADOW,
                  borderRadius: '16px',
                }}
              >
                <div className="flex items-center gap-3">
                  <AIIndicator status="processing" />
                  <p style={{ color: '#2A2A2A' }}>
                    {t('nutrition.reflection.analyzing') || '正在分析中...'}
                  </p>
                </div>
              </div>
            )}

            {processingStatus === 'failed' && (
              <div
                className="p-5 rounded-2xl"
                style={{
                  background: 'rgba(255, 205, 205, 0.95)',
                  border: '1px solid rgba(255, 100, 100, 0.3)',
                  boxShadow: CARD_SHADOW,
                  borderRadius: '16px',
                }}
              >
                <p className="text-sm mb-2" style={{ color: '#2A2A2A' }}>
                  {t('nutrition.reflection.analysisFailed') || '分析失败'}
                </p>
                {errorMessage && (
                  <p className="text-sm" style={{ color: '#2A2A2A', opacity: 0.8 }}>
                    {errorMessage}
                  </p>
                )}
              </div>
            )}

            {/* AI Analysis Results */}
            {processingStatus === 'completed' && aiAnalysis && (
              <>
                {/* Encouragement Card */}
                <div
                  className="p-5 rounded-2xl"
                  style={{
                    background: CARD_BG,
                    border: CARD_BORDER,
                    boxShadow: CARD_SHADOW,
                    borderRadius: '16px',
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <AIIndicator status="completed" />
                    <h2 className="text-lg font-bold" style={{ color: '#2A2A2A' }}>
                      {t('nutrition.reflection.encouragement') || '鼓励'}
                    </h2>
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed" style={{ color: '#2A2A2A' }}>
                    {aiAnalysis.encouragement}
                  </p>
                </div>

                {/* Suggestions Card */}
                {aiAnalysis.suggestions.length > 0 && (
                  <div
                    className="p-5 rounded-2xl"
                    style={{
                      background: CARD_BG,
                      border: CARD_BORDER,
                      boxShadow: CARD_SHADOW,
                      borderRadius: '16px',
                    }}
                  >
                    <h2
                      className="text-lg font-bold mb-3 flex items-center gap-2"
                      style={{ color: '#2A2A2A' }}
                    >
                      <CheckSquare size={20} strokeWidth={2} style={{ color: '#90EE90' }} />
                      {t('nutrition.reflection.suggestions') || '建议'}
                    </h2>
                    <ul className="space-y-2">
                      {aiAnalysis.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2 leading-relaxed">
                          <span style={{ color: '#2A2A2A', opacity: 0.8 }}>·</span>
                          <span style={{ color: '#2A2A2A' }}>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suitability Card */}
                <div
                  className="p-5 rounded-2xl"
                  style={{
                    background: CARD_BG,
                    border: CARD_BORDER,
                    boxShadow: CARD_SHADOW,
                    borderRadius: '16px',
                  }}
                >
                  <h2
                    className="text-lg font-bold mb-3 flex items-center gap-2"
                    style={{ color: '#2A2A2A' }}
                  >
                    <Heart size={20} strokeWidth={2} style={{ color: '#FF6B6B' }} />
                    {t('nutrition.reflection.suitability') || '适宜性'}
                  </h2>
                  <p className="leading-relaxed" style={{ color: '#2A2A2A' }}>
                    {aiAnalysis.suitability}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
