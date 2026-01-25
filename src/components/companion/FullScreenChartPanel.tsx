import { useCompanion } from '../../hooks/useCompanion';
import NeonGlowChart from './NeonGlowChart';
import ChartCompanionElement from './ChartCompanionElement';

interface FullScreenChartPanelProps {
  module: 'health' | 'nutrition' | 'emotion';
}

export default function FullScreenChartPanel({ module }: FullScreenChartPanelProps) {
  const { characterState } = useCompanion('baiqi');

  // Sample chart data - in real implementation, this would come from actual data
  const sampleData = [
    { x: 'Mon', y: 65 },
    { x: 'Tue', y: 72 },
    { x: 'Wed', y: 68 },
    { x: 'Thu', y: 75 },
    { x: 'Fri', y: 70 },
    { x: 'Sat', y: 78 },
    { x: 'Sun', y: 73 },
  ];

  const moduleLabels: Record<string, { title: string; description: string }> = {
    health: { title: '健康数据', description: 'Health Data' },
    nutrition: { title: '营养数据', description: 'Nutrition Data' },
    emotion: { title: '情绪数据', description: 'Emotion Data' },
  };

  const label = moduleLabels[module] || { title: '数据', description: 'Data' };

  return (
    <div className="min-h-screen pt-16 pb-24 px-4">
      {/* Panel Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading mb-2" style={{ color: '#4A4A4A' }}>
          {label.title}
        </h1>
        <p className="text-base font-body" style={{ color: '#4A4A4A', opacity: 0.8 }}>
          {label.description}
        </p>
      </div>

      {/* Chart Container - FR-031F */}
      <div
        className="relative rounded-3xl p-6 mb-8"
        style={{
          background: 'rgba(255, 255, 255, 0.2)', // #ffffff33 equivalent
          backdropFilter: 'blur(15px)',
          minHeight: '300px',
        }}
      >
        <NeonGlowChart
          data={sampleData}
          width={window.innerWidth - 64}
          height={300}
          colorStart="#A78BFA"
          colorEnd="#F472B6"
        />
      </div>

      {/* Chart Companion Element - FR-031G */}
      <ChartCompanionElement
        characterId="baiqi"
        characterState={characterState}
        chartData={sampleData}
        chartType={module}
      />
    </div>
  );
}
