import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

export type EncyclopediaCategory = "all" | "letter" | "number" | "punctuation" | "prosign";

interface SearchAndFiltersProps {
  query: string;
  onQueryChange: (value: string) => void;
  category: EncyclopediaCategory;
  onCategoryChange: (category: EncyclopediaCategory) => void;
}

const CATEGORY_KEYS: { value: EncyclopediaCategory; key: string }[] = [
  { value: "all", key: "encyclopedia.categories.all" },
  { value: "letter", key: "encyclopedia.categories.letter" },
  { value: "number", key: "encyclopedia.categories.number" },
  { value: "punctuation", key: "encyclopedia.categories.punctuation" },
  { value: "prosign", key: "encyclopedia.categories.prosign" },
];

export function SearchAndFilters({
  query,
  onQueryChange,
  category,
  onCategoryChange,
}: SearchAndFiltersProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col sm:flex-row gap-md sm:items-center">
      <div className="relative flex-1 max-w-sm">
        <Icon
          name="search"
          className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
        />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={t("encyclopedia.searchPlaceholder") ?? ""}
          className="w-full pl-10 pr-md py-2.5 rounded-lg bg-surface-container border border-outline-variant/40 text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary transition-colors"
        />
      </div>
      <div className="flex gap-sm flex-wrap">
        {CATEGORY_KEYS.map((c) => (
          <button
            key={c.value}
            onClick={() => onCategoryChange(c.value)}
            className={cn(
              "px-md py-2 rounded-full text-label-sm font-medium border transition-colors",
              category === c.value
                ? "bg-primary text-on-primary border-primary"
                : "bg-transparent text-on-surface-variant border-outline-variant/40 hover:border-primary"
            )}
          >
            {t(c.key)}
          </button>
        ))}
      </div>
    </div>
  );
}
