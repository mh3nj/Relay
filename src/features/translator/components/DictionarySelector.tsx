import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { exportDictionary, parseImportedDictionary } from "@/lib/customDictionary";
import type { CustomDictionary } from "@/lib/customDictionary";
import { downloadJson } from "@/lib/exportUtils";

interface DictionarySelectorProps {
  dictionaries: CustomDictionary[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
  onCreate: (name: string) => Promise<CustomDictionary>;
  onDuplicate: (id: string) => Promise<CustomDictionary | null>;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onImport: (dict: CustomDictionary) => Promise<void>;
  onEdit: (id: string) => void;
}

export function DictionarySelector({
  dictionaries,
  activeId,
  onSelect,
  onCreate,
  onDuplicate,
  onRename,
  onDelete,
  onImport,
  onEdit,
}: DictionarySelectorProps) {
  const { t } = useTranslation();
  const [importError, setImportError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const active = dictionaries.find((d) => d.id === activeId) ?? null;

  const handleCreate = async () => {
    const dict = await onCreate(t("translator.dictionary.new") ?? "New Dictionary");
    onSelect(dict.id);
    onEdit(dict.id);
  };

  const handleExport = () => {
    if (!active) return;
    downloadJson(JSON.parse(exportDictionary(active)), `${active.name}.json`);
  };

  const handleImportFile = async (file: File) => {
    setImportError(false);
    const text = await file.text();
    const parsed = parseImportedDictionary(text);
    if (!parsed) {
      setImportError(true);
      return;
    }
    await onImport(parsed);
    onSelect(parsed.id);
  };

  return (
    <Card className="p-lg flex flex-col gap-md">
      <div className="flex items-center justify-between">
        <h3 className="font-heading-md text-heading-md text-on-surface">
          {t("translator.dictionary.title")}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          icon={<Icon name="add" className="w-4 h-4" />}
          onClick={handleCreate}
        >
          {t("translator.dictionary.new")}
        </Button>
      </div>

      <select
        value={activeId ?? ""}
        onChange={(e) => onSelect(e.target.value || null)}
        className="w-full py-2.5 px-md rounded-lg bg-surface-container border border-outline-variant/40 text-body-md text-on-surface focus:outline-none focus:border-primary"
      >
        <option value="">{t("translator.dictionary.default")}</option>
        {dictionaries.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>

      {active && (
        <div className="flex flex-wrap gap-sm">
          <Button variant="outline" size="sm" onClick={() => onEdit(active.id)}>
            {t("translator.dictionary.editorTitle")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const copy = await onDuplicate(active.id);
              if (copy) onSelect(copy.id);
            }}
          >
            {t("translator.dictionary.duplicate")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const name = window.prompt(
                t("translator.dictionary.namePlaceholder") ?? "",
                active.name
              );
              if (name) void onRename(active.id, name);
            }}
          >
            {t("translator.dictionary.rename")}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            {t("translator.dictionary.export")}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (window.confirm(t("translator.dictionary.deleteConfirm") ?? "")) {
                void onDelete(active.id);
              }
            }}
          >
            {t("translator.dictionary.delete")}
          </Button>
        </div>
      )}

      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleImportFile(file);
            e.target.value = "";
          }}
        />
        <Button
          variant="ghost"
          size="sm"
          icon={<Icon name="upload" className="w-4 h-4" />}
          onClick={() => fileInputRef.current?.click()}
        >
          {t("translator.dictionary.import")}
        </Button>
        {importError && (
          <p className="text-error text-sm mt-xs">{t("translator.dictionary.importFailed")}</p>
        )}
      </div>
    </Card>
  );
}
