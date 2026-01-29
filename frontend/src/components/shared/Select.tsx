import { useState, useRef, useEffect } from 'react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps {
  value: string | number;
  options: SelectOption[];
  onChange: (value: string | number) => void;
  className?: string;
}

export default function Select({ value, options, onChange, className = '' }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div className={`relative ${className}`} ref={selectRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2.5 clay-button bg-white text-clay-text 
                   font-body text-base
                   min-w-[140px] flex items-center justify-between gap-2 touch-target rounded-[18px]"
      >
        <span>{selectedOption.label}</span>
        <span className={`text-lg transition-transform ${isOpen ? 'rotate-180' : ''}`}>🔽</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 z-20 clay-card min-w-full overflow-hidden">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 text-left font-body text-base touch-target flex items-center gap-2 transition-colors rounded-[16px] mx-1 my-1 ${
                  option.value === value
                    ? 'bg-clay-primary text-white font-semibold'
                    : 'text-clay-text hover:bg-clay-lavender'
                }`}
              >
                {option.value === value && (
                  <span className="text-white">✅</span>
                )}
                <span className={option.value === value ? '' : 'ml-6'}>{option.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

