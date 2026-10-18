import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-md">
      <div>
        <h2 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-background m-0">
          {title}
        </h2>
        {description && (
          <p className="font-body-md text-body-md text-on-surface-variant mt-sm">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
