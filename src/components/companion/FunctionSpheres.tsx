import { HeartPulse, Leaf, Smile } from 'lucide-react';

interface FunctionSpheresProps {
  onHealthClick: () => void;
  onNutritionClick: () => void;
  onEmotionClick: () => void;
}

/**
 * Function Spheres Component
 *
 * Top-right corner vertical stack of 3 circular function spheres
 * FR-031D: Function spheres with glassmorphism styling
 */
export default function FunctionSpheres({
  onHealthClick,
  onNutritionClick,
  onEmotionClick,
}: FunctionSpheresProps) {
  return (
    <div
      className="fixed right-5 z-[60] flex flex-col gap-5"
      style={{
        top: 'calc(env(safe-area-inset-top) + 20px)',
      }}
    >
      {/* Health Sphere */}
      <button
        onClick={onHealthClick}
        className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 touch-target companion-sphere-pulse"
        style={{
          // Premium glassmorphism styling - FR-030B
          background: 'rgba(255, 255, 255, 0.2)', // Pink-tinted glass
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.5)', // Bright border
          boxShadow: '0 4px 16px rgba(255, 255, 255, 0.3), 0 0 0 1px rgba(255, 209, 220, 0.2)',
          color: '#FF7E9D', // Deep pink icon color
        }}
        onMouseDown={e => {
          // Pressed state
          e.currentTarget.style.opacity = '0.8';
          e.currentTarget.style.transform = 'scale(0.95)';
        }}
        onMouseUp={e => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.transform = 'scale(1)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.transform = 'scale(1)';
        }}
        aria-label="Health"
      >
        <HeartPulse size={20} strokeWidth={2} />
      </button>

      {/* Nutrition Sphere */}
      <button
        onClick={onNutritionClick}
        className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 touch-target companion-sphere-pulse"
        style={{
          background: 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          boxShadow: '0 4px 16px rgba(255, 255, 255, 0.3), 0 0 0 1px rgba(255, 209, 220, 0.2)',
          color: '#FF7E9D',
        }}
        onMouseDown={e => {
          e.currentTarget.style.opacity = '0.8';
          e.currentTarget.style.transform = 'scale(0.95)';
        }}
        onMouseUp={e => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.transform = 'scale(1)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.transform = 'scale(1)';
        }}
        aria-label="Nutrition"
      >
        <Leaf size={20} strokeWidth={2} />
      </button>

      {/* Emotion Sphere */}
      <button
        onClick={onEmotionClick}
        className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 touch-target companion-sphere-pulse"
        style={{
          background: 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          boxShadow: '0 4px 16px rgba(255, 255, 255, 0.3), 0 0 0 1px rgba(255, 209, 220, 0.2)',
          color: '#FF7E9D',
        }}
        onMouseDown={e => {
          e.currentTarget.style.opacity = '0.8';
          e.currentTarget.style.transform = 'scale(0.95)';
        }}
        onMouseUp={e => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.transform = 'scale(1)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.transform = 'scale(1)';
        }}
        aria-label="Emotion"
      >
        <Smile size={20} strokeWidth={2} />
      </button>
    </div>
  );
}
