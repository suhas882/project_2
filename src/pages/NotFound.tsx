import { Compass } from 'lucide-react';
import { ButtonLink, EmptyState } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl py-10">
      <EmptyState icon={<Compass className="size-6" />} title="Page not found" action={<ButtonLink to="/today">Go to Today</ButtonLink>}>
        That address doesn't match a Remitra screen.
      </EmptyState>
    </div>
  );
}
