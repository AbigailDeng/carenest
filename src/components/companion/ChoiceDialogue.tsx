import { ConversationMessage } from '../../types';

interface ChoiceDialogueProps {
  message: ConversationMessage;
  onChoiceSelect: (choice: string) => void;
}

/**
 * ChoiceDialogue Component
 *
 * Displays choice-based dialogue where users select from 2-5 predefined response options.
 * Used for occasional important emotional moments or relationship milestones.
 * FR-007: Choice-based dialogue is very limited (occasional use, not primary interaction method)
 */
export default function ChoiceDialogue({ message, onChoiceSelect }: ChoiceDialogueProps) {
  if (!message.choices || message.choices.length < 2 || message.choices.length > 5) {
    return null;
  }

  return (
    <div className="mt-4 space-y-2">
      {message.choices.map((choice, index) => (
        <button
          key={index}
          onClick={() => onChoiceSelect(choice)}
          className="w-full px-4 py-3 rounded-2xl text-left transition-all duration-200 touch-target"
          style={{
            // Premium glassmorphism styling - FR-030B
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(25px)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            boxShadow: '0 4px 24px rgba(255, 255, 255, 0.2)',
            color: '#4A4A4A',
          }}
          onMouseDown={e => {
            e.currentTarget.style.opacity = '0.8';
            e.currentTarget.style.transform = 'scale(0.98)';
          }}
          onMouseUp={e => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <span className="text-base">{choice}</span>
        </button>
      ))}
    </div>
  );
}
