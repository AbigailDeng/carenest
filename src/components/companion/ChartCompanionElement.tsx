import { useState, useEffect } from 'react';
import { generateChartDataInterpretation } from '../../services/companionService';
import { CharacterState } from '../../types';
import { getCharacterConfig } from '../../config/characters';

interface ChartCompanionElementProps {
  characterId: string;
  characterState: CharacterState | null;
  chartData: Array<{ x: number | string; y: number }>;
  chartType: 'health' | 'nutrition' | 'emotion';
}

export default function ChartCompanionElement({
  characterId,
  characterState,
  chartData,
  chartType,
}: ChartCompanionElementProps) {
  const [interpretation, setInterpretation] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const config = getCharacterConfig(characterId);

  useEffect(() => {
    if (!characterState) {
      setLoading(false);
      return;
    }

    const generateInterpretation = async () => {
      try {
        setLoading(true);
        const result = await generateChartDataInterpretation({
          characterId,
          characterState,
          chartData,
          chartType,
        });
        setInterpretation(result);
      } catch (error) {
        console.warn('Failed to generate chart interpretation:', error);
        // Fallback to default message
        setInterpretation('数据看起来不错，继续保持。');
      } finally {
        setLoading(false);
      }
    };

    generateInterpretation();
  }, [characterId, characterState, chartData, chartType]);

  if (!characterState || !config) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-10 flex flex-col items-end gap-2">
      {/* Character avatar */}
      <div className="relative">
        <img
          src="/images/images.jpg"
          alt={config.name.en || config.name.zh || 'Character'}
          className="w-16 h-16 rounded-full object-cover border-2 border-white/90 shadow-lg"
          style={{
            filter: 'drop-shadow(0 0 8px rgba(253, 238, 244, 0.6))',
          }}
        />
      </div>

      {/* Dialogue bubble - small version with premium glassmorphism - FR-031G, FR-030B */}
      <div
        className="max-w-[200px] px-4 py-3 rounded-2xl"
        style={{
          // T064: Premium glassmorphism styling - FR-030B
          background: 'rgba(255, 255, 255, 0.15)', // Extremely transparent white
          backdropFilter: 'blur(25px)', // Strong blur effect
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.4)', // Subtle bright border
          boxShadow: '0 4px 24px rgba(255, 255, 255, 0.2)', // Soft white outer glow
          color: '#4A4A4A', // Dark gray for readability
        }}
      >
        <p className="text-sm font-body leading-relaxed" style={{ color: '#4A4A4A' }}>
          {loading ? '...' : interpretation}
        </p>
      </div>
    </div>
  );
}
