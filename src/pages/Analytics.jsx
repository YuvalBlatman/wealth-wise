import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, BarChart, PieChart, HelpCircle, Clock } from 'lucide-react';

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Portfolio Analytics</h2>
        <p className="text-muted-foreground">
          Advanced insights and analysis of your investment performance
        </p>
      </div>
      
      <Card className="border-dashed border-2 border-muted-foreground/25">
        <CardHeader>
          <CardTitle className="flex items-center">
            <LineChart className="w-5 h-5 mr-2 text-muted-foreground" />
            Analytics Feature Coming Soon
          </CardTitle>
          <CardDescription>
            We're developing powerful analytics tools for your investments
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 py-8">
          <div className="rounded-full bg-muted p-6">
            <BarChart className="h-10 w-10 text-muted-foreground" />
          </div>
          <div className="space-y-2 text-center">
            <h3 className="text-xl font-semibold">Unlock Portfolio Insights</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Soon you'll have access to detailed performance metrics, sector analysis,
              risk assessment, and personalized investment recommendations.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" disabled className="flex items-center">
            <HelpCircle className="w-4 h-4 mr-2" />
            Learn More
          </Button>
          <Button disabled className="flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            Get Notified
          </Button>
        </CardFooter>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Analysis</CardTitle>
            <CardDescription>Coming Soon</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Detailed metrics on your portfolio's performance over time, including returns, volatility, and benchmarks.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Asset Allocation</CardTitle>
            <CardDescription>Coming Soon</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Visualize your portfolio's diversification across different asset classes and sectors.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Risk Assessment</CardTitle>
            <CardDescription>Coming Soon</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Evaluate your portfolio's risk profile and get recommendations for optimization.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}