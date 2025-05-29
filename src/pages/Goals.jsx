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
import { Clock, Target, PieChart, HelpCircle } from 'lucide-react';

export default function Goals() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Financial Goals</h2>
        <p className="text-muted-foreground">
          Set and track your financial objectives for the future
        </p>
      </div>
      
      <Card className="border-dashed border-2 border-muted-foreground/25">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2 text-muted-foreground" />
            Goals Feature Coming Soon
          </CardTitle>
          <CardDescription>
            We're working on an amazing goals tracking feature
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 py-8">
          <div className="rounded-full bg-muted p-6">
            <PieChart className="h-10 w-10 text-muted-foreground" />
          </div>
          <div className="space-y-2 text-center">
            <h3 className="text-xl font-semibold">Define Your Financial Future</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Soon you'll be able to create personalized financial goals, track your progress,
              and get insights on how to achieve them faster.
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
            <CardTitle>Retirement Planning</CardTitle>
            <CardDescription>Coming Soon</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Set targets for your retirement fund and track your progress over time.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Emergency Fund</CardTitle>
            <CardDescription>Coming Soon</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Build a safety net with recommended targets based on your expenses.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Major Purchases</CardTitle>
            <CardDescription>Coming Soon</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Plan for big expenses like a home, car, or education with dedicated savings goals.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}