import { useState, KeyboardEvent } from "react";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface MenuInputProps {
  menus: string[];
  onMenusChange: (menus: string[]) => void;
}

export function MenuInput({ menus, onMenusChange }: MenuInputProps) {
  const [inputValue, setInputValue] = useState("");

  const addMenu = (menu: string) => {
    const trimmedMenu = menu.trim();
    if (trimmedMenu && !menus.includes(trimmedMenu)) {
      onMenusChange([...menus, trimmedMenu]);
    }
    setInputValue("");
  };

  const removeMenu = (index: number) => {
    const newMenus = menus.filter((_, i) => i !== index);
    onMenusChange(newMenus);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addMenu(inputValue);
    } else if (e.key === ',' || e.key === 'Tab') {
      e.preventDefault();
      addMenu(inputValue);
    }
  };

  const handleInputChange = (value: string) => {
    // Handle comma-separated input
    if (value.includes(',')) {
      const parts = value.split(',');
      const newMenu = parts[0].trim();
      if (newMenu) {
        addMenu(newMenu);
      }
      setInputValue(parts.slice(1).join(','));
    } else {
      setInputValue(value);
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="김치찌개 (엔터 또는 쉼표로 추가)"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyPress}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addMenu(inputValue)}
            disabled={!inputValue.trim()}
            className="px-3"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {menus.length === 0 && (
          <p className="text-xs text-gray-500">
            💡 팁: 메뉴를 입력하고 엔터를 누르거나 + 버튼을 클릭하세요
          </p>
        )}
      </div>
      
      {menus.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {menus.map((menu, index) => (
            <Badge
              key={index}
              variant="default"
              className="bg-blue-500 text-white px-2 py-1 text-sm flex items-center gap-1"
            >
              {menu}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-white hover:text-gray-200"
                onClick={() => removeMenu(index)}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
