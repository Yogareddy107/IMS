import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white border border-[#E5E7EB] rounded-lg">
      {icon && <div className="p-3 mb-3 text-neutral-500 bg-neutral-100 rounded-full">{icon}</div>}
      <h3 className="text-base font-medium text-[#111111]">{title}</h3>
      <p className="mt-1 text-sm text-[#6B7280] max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <div className="mt-4">
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
