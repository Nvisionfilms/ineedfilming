import { useRouter } from 'next/router';
import { useProject } from '@/hooks/use-project';
import { cn } from '@/lib/utils';
import { FileText, MapPin, Video } from 'lucide-react';
import { Button } from '../ui/button';

type TabType = 'shot-list' | 'call-sheet' | 'locations';

export const ProductionNavigation = () => {
  const router = useRouter();
  const { projectId } = router.query;
  const { data: project } = useProject(projectId as string);

  const tabs = [
    {
      id: 'shot-list',
      name: 'Shot List',
      icon: Video,
      href: `/projects/${projectId}/shot-list`,
    },
    {
      id: 'call-sheet',
      name: 'Call Sheet',
      icon: FileText,
      href: `/projects/${projectId}/call-sheet`,
    },
    {
      id: 'locations',
      name: 'Locations',
      icon: MapPin,
      href: `/projects/${projectId}/locations`,
    },
  ] as const;

  const currentTab = router.pathname.split('/').pop() as TabType;

  return (
    <div className="border-b border-gray-200 dark:border-gray-800">
      <div className="flex space-x-4">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            className={cn(
              'rounded-none border-b-2 border-transparent',
              currentTab === tab.id
                ? 'border-primary text-primary font-medium'
                : 'text-muted-foreground hover:text-foreground hover:border-gray-300 dark:hover:border-gray-600',
              'px-4 py-3 text-sm font-medium transition-colors'
            )}
            onClick={() => router.push(tab.href)}
          >
            <tab.icon className="mr-2 h-4 w-4" />
            {tab.name}
          </Button>
        ))}
      </div>
    </div>
  );
};
