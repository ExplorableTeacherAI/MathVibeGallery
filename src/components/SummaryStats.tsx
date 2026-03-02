import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from 'lucide-react';

interface StatItem {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  color?: string;
}

interface SummaryStatsProps {
  stats: StatItem[];
  className?: string;
}

export const SummaryStats: React.FC<SummaryStatsProps> = ({
  stats,
  className = ""
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        const iconColor = stat.color || 'text-blue-600';
        
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <IconComponent className={`h-4 w-4 ${iconColor}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};