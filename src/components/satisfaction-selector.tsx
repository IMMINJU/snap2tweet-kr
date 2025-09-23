import { satisfactionLevels } from "@shared/schema";
import { Button } from "@/components/ui/button";

interface SatisfactionSelectorProps {
  satisfaction: typeof satisfactionLevels[number];
  onSatisfactionChange: (satisfaction: typeof satisfactionLevels[number]) => void;
}

const satisfactionEmojis = {
  "애매함": "😐",
  "나쁘지 않음": "🙂",
  "맛있음": "🤤",
  "개쩜": "🤯",
};

export function SatisfactionSelector({ satisfaction, onSatisfactionChange }: SatisfactionSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {satisfactionLevels.map((level) => (
        <Button
          key={level}
          variant={satisfaction === level ? "default" : "outline"}
          className={`p-3 h-auto flex flex-col items-center space-y-1 ${
            satisfaction === level 
              ? 'bg-blue-500 text-white border-blue-500' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onClick={() => onSatisfactionChange(level)}
        >
          <div className="text-2xl">{satisfactionEmojis[level]}</div>
          <div className="text-xs">{level}</div>
        </Button>
      ))}
    </div>
  );
}
