import { Progress } from "@/components/ui/progress";
import { TrendingUp, Target, Zap, CheckCircle } from "lucide-react";

interface QualityMetric {
  label: string;
  value: number;
  target: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const metrics: QualityMetric[] = [
  {
    label: "Content Quality",
    value: 94,
    target: 90,
    icon: Target,
    color: "text-success"
  },
  {
    label: "Brand Alignment",
    value: 88,
    target: 85,
    icon: CheckCircle,
    color: "text-primary"
  },
  {
    label: "Engagement Score",
    value: 92,
    target: 80,
    icon: TrendingUp,
    color: "text-accent"
  },
  {
    label: "Generation Speed",
    value: 96,
    target: 95,
    icon: Zap,
    color: "text-warning"
  }
];

export function QualityMetrics() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <div 
          key={metric.label} 
          className="bg-gray-800 border border-gray-600 rounded-lg shadow-professional p-6 animate-slide-up"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg bg-gray-700 ${metric.color}`}>
                <metric.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-white">
                  {metric.label}
                </div>
                <div className="text-xs text-gray-300">
                  Target: {metric.target}%
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                {metric.value}%
              </div>
              <div className={`text-sm ${metric.value >= metric.target ? 'text-green-400' : 'text-yellow-400'}`}>
                {metric.value >= metric.target ? '+' : ''}{metric.value - metric.target}
              </div>
            </div>
          </div>
          
          <Progress 
            value={metric.value} 
            className="h-2"
          />
        </div>
      ))}
    </div>
  );
}