import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/layout/PageHeader";
import { DEFAULT_ALPHABET } from "@/lib/morse";
import { NATO_PHONETIC } from "@/lib/encyclopediaData";
import { SearchAndFilters } from "@/features/encyclopedia/components/SearchAndFilters";
import type { EncyclopediaCategory } from "@/features/encyclopedia/components/SearchAndFilters";
import { CharacterGrid } from "@/features/encyclopedia/components/CharacterGrid";
import { ProsignsTable } from "@/features/encyclopedia/components/ProsignsTable";
import { AbbreviationsSidebar, HistorySidebar } from "@/features/encyclopedia/components/Sidebars";

export function EncyclopediaPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<EncyclopediaCategory>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    return DEFAULT_ALPHABET.filter((symbol) => {
      if (category !== "all" && category !== "prosign" && symbol.category !== category) {
        return false;
      }
      if (category === "prosign") return false; // prosigns render in their own table below
      if (!q) return true;
      const phonetic = NATO_PHONETIC[symbol.char]?.toUpperCase() ?? "";
      return symbol.char.includes(q) || phonetic.includes(q) || symbol.code.includes(q);
    });
  }, [query, category]);

  return (
    <>
      <PageHeader title={t("encyclopedia.title")} description={t("encyclopedia.description")} />

      <SearchAndFilters
        query={query}
        onQueryChange={setQuery}
        category={category}
        onCategoryChange={setCategory}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg items-start reveal-item" key={category}>
        <div className="lg:col-span-2 flex flex-col gap-lg">
          <CharacterGrid symbols={filtered} />
          {(category === "all" || category === "prosign") && <ProsignsTable query={query} />}
        </div>
        <div className="flex flex-col gap-lg" style={{ "--reveal-delay": "60ms" } as CSSProperties}>
          <AbbreviationsSidebar />
          <HistorySidebar />
        </div>
      </div>
    </>
  );
}
