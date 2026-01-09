import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import { getSugarReductionCups, pourSugarReductionCup, resetSugarReductionCups } from '../../services/storage/indexedDB';
import Card from '../shared/Card';
import Button from '../shared/Button';

export default function SugarReductionEasterEgg() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [cups, setCups] = useState({ smallCups: 0, largeCups: 0 });
  const [loading, setLoading] = useState(true);
  const [pouring, setPouring] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  
  useEffect(() => {
    loadCups();
  }, []);
  
  const loadCups = async () => {
    try {
      const data = await getSugarReductionCups();
      setCups({ smallCups: data.smallCups, largeCups: data.largeCups });
    } catch (err) {
      console.error('Failed to load cups:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePour = async () => {
    try {
      setPouring(true);
      const previousSmall = cups.smallCups;
      const previousLarge = cups.largeCups;
      
      const updated = await pourSugarReductionCup();
      setCups({ smallCups: updated.smallCups, largeCups: updated.largeCups });
      
      // Check if a large cup was just formed
      if (previousSmall === 4 && updated.smallCups === 0 && updated.largeCups > previousLarge) {
        setCelebrating(true);
        setTimeout(() => setCelebrating(false), 3000);
      }
    } catch (err) {
      console.error('Failed to pour cup:', err);
    } finally {
      setPouring(false);
    }
  };
  
  const handleReset = async () => {
    if (!confirm(t('nutrition.easterEgg.confirmReset'))) {
      return;
    }
    
    try {
      await resetSugarReductionCups();
      setCups({ smallCups: 0, largeCups: 0 });
    } catch (err) {
      console.error('Failed to reset cups:', err);
    }
  };
  
  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-clay-bg">
        <p className="text-clay-textDim font-body">{t('common.loading')}</p>
      </div>
    );
  }
  
  return (
    <div className="p-6 min-h-screen bg-clay-bg pb-20">
      <h1 className="text-2xl font-heading text-clay-text mb-6">
        {t('nutrition.easterEgg.title')}
      </h1>
      
      <p className="text-clay-textDim font-body mb-6">
        {t('nutrition.easterEgg.description')}
      </p>
      
      {/* Celebration message */}
      {celebrating && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50 animate-bounce">
          <div className="text-center">
            <p className="text-4xl mb-2">🎉</p>
            <p className="text-yellow-900 font-semibold font-body">
              {t('nutrition.easterEgg.celebration')}
            </p>
          </div>
        </Card>
      )}
      
      {/* Cups display */}
      <Card className="mb-6">
        <div className="text-center">
          {/* Large cups */}
          {cups.largeCups > 0 && (
            <div className="mb-6">
              <p className="text-sm text-clay-textDim mb-3 font-body">
                {t('nutrition.easterEgg.largeCups')}
              </p>
              <div className="flex justify-center gap-3 flex-wrap">
                {Array.from({ length: cups.largeCups }).map((_, i) => (
                  <span key={i} className="text-5xl">☕</span>
                ))}
              </div>
              <p className="text-lg font-semibold text-clay-text mt-2 font-body">
                {cups.largeCups} {t('nutrition.easterEgg.largeCup')}
              </p>
            </div>
          )}
          
          {/* Small cups */}
          <div>
            <p className="text-sm text-clay-textDim mb-3 font-body">
              {t('nutrition.easterEgg.smallCups')}
            </p>
            <div className="flex justify-center gap-2 flex-wrap">
              {Array.from({ length: cups.smallCups }).map((_, i) => (
                <span key={i} className="text-3xl">🥤</span>
              ))}
              {cups.smallCups < 5 && (
                <span className="text-3xl opacity-30">🥤</span>
              )}
            </div>
            <p className="text-sm text-clay-textDim mt-2 font-body">
              {cups.smallCups}/5 {t('nutrition.easterEgg.smallCup')}
            </p>
          </div>
        </div>
      </Card>
      
      {/* Pour button */}
      <Card className="mb-6">
        <Button
          variant="primary"
          fullWidth
          size="lg"
          onClick={handlePour}
          disabled={pouring}
          className="min-h-[80px]"
        >
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl">{pouring ? '⏳' : '🥤'}</span>
            <span className="text-lg font-body">
              {pouring ? t('nutrition.easterEgg.pouring') : t('nutrition.easterEgg.pour')}
            </span>
          </div>
        </Button>
      </Card>
      
      {/* Reset button */}
      {(cups.smallCups > 0 || cups.largeCups > 0) && (
        <Card className="mb-6">
          <Button
            variant="outline"
            fullWidth
            onClick={handleReset}
            className="text-clay-textDim"
          >
            {t('nutrition.easterEgg.reset')}
          </Button>
        </Card>
      )}
      
      {/* Back button */}
      <Button
        variant="outline"
        fullWidth
        onClick={() => navigate('/nutrition')}
      >
        {t('common.back')}
      </Button>
    </div>
  );
}

