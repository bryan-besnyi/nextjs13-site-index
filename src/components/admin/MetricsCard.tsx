import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MetricsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export default function MetricsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className
}: MetricsCardProps) {
  const cardId = title.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <Card 
      className={cn("relative overflow-hidden hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50/50 shadow-sm", className)}
      role="img"
      aria-labelledby={`${cardId}-title`}
      aria-describedby={description ? `${cardId}-desc` : undefined}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle 
          id={`${cardId}-title`}
          className="text-sm font-semibold text-gray-700"
        >
          {title}
        </CardTitle>
        <div 
          className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-sm"
          aria-hidden="true"
        >
          <Icon className="h-5 w-5 text-blue-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div 
            className="text-3xl font-bold text-gray-900 tracking-tight"
            aria-label={`${title}: ${value}${description ? `, ${description}` : ''}`}
          >
            {value}
          </div>
          {trend && (
            <div className="flex items-center">
              <div className={cn(
                "flex items-center text-sm font-medium px-2 py-1 rounded-full",
                trend.isPositive 
                  ? "text-green-700 bg-green-100/80" 
                  : "text-red-700 bg-red-100/80"
              )}>
                {trend.isPositive ? (
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                )}
                {Math.abs(trend.value)}%
              </div>
            </div>
          )}
          {description && (
            <p 
              id={`${cardId}-desc`}
              className="text-sm text-gray-600"
            >
              {description}
            </p>
          )}
        </div>
      </CardContent>
      {/* Decorative accent */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-60" />
    </Card>
  );
}