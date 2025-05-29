import React from 'react';
import { formatCurrency, formatDate, getCategoryNameHebrew } from '@/components/utils/formatters';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Edit, Trash2, TrendingUp, TrendingDown, Minus, Box,
  Building, Landmark, Briefcase, ShieldCheck, HelpCircle,
  Wallet, PiggyBank, Heart, Gem, FileText, BarChart, BarChartHorizontal,
  GitBranch, Layers, Save as SaveIcon, Activity, Baby, UserCheck,
  GraduationCap, LifeBuoy, Bed, Accessibility, Rocket, AreaChart, Users,
  Coins, Car, Image, Globe, Handshake, Bitcoin, Package, Store, CreditCard,
  DollarSign, Calendar as CalendarIcon, CircleDot, PackageSearch // Added PackageSearch as default
} from 'lucide-react';

// Mapping icon names (strings) to actual Lucide components
const iconMap = {
  TrendingUp, Building, Landmark, Briefcase, ShieldCheck, Box, HelpCircle,
  Wallet, PiggyBank, Heart, Gem, FileText, BarChart, BarChartHorizontal,
  GitBranch, Layers, SaveIcon, Activity, Baby, UserCheck,
  GraduationCap, LifeBuoy, Bed, Accessibility, Rocket, AreaChart, Users,
  Coins, Car, Image, Globe, Handshake, Bitcoin, Package, Store, CreditCard,
  DollarSign, CalendarIcon, CircleDot, PackageSearch
};

const categoryMainIcons = {
  'financial_instruments': Briefcase,
  'savings_deposits': Landmark,
  'pension_insurance': ShieldCheck,
  'alternative_assets': Box
};

export default function AssetCard({ asset, assetType, onEdit, onDelete }) {
  if (!asset) return null;

  // Determine the icon for the asset type, or use the main category icon, or a default
  let IconComponent = PackageSearch; // Default icon
  if (assetType?.icon_name && iconMap[assetType.icon_name]) {
    IconComponent = iconMap[assetType.icon_name];
  } else if (categoryMainIcons[asset.category]) {
    IconComponent = categoryMainIcons[asset.category];
  }
  
  const renderDailyChange = () => {
    if (asset.category !== 'financial_instruments' || asset.update_method !== 'automatic' || typeof asset.daily_change_percent !== 'number') {
      return null;
    }
    const change = asset.daily_change_percent;
    const ChangeIcon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;
    const color = change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-muted-foreground';

    return (
      <Badge variant="outline" className={`flex items-center gap-1 ${color} border-current`}>
        <ChangeIcon className="h-3 w-3" />
        {change.toFixed(2)}%
      </Badge>
    );
  };

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg w-full" dir="rtl">
      <CardHeader className="flex flex-row items-start justify-between bg-muted/30 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-md">
            <IconComponent className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold leading-tight">{asset.description}</CardTitle>
            <p className="text-xs text-muted-foreground">{assetType?.name_he || asset.asset_type_key}</p>
          </div>
        </div>
        <div className="text-left">
          <p className="text-lg font-bold">{formatCurrency(asset.current_value, asset.currency)}</p>
          {renderDailyChange()}
        </div>
      </CardHeader>
      <CardContent className="p-4 text-sm space-y-1.5">
        {asset.symbol && (asset.category === 'financial_instruments' || (asset.category === 'alternative_assets' && asset.asset_type_key === 'crypto')) && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">סימול:</span>
            <span className="font-medium" dir="ltr">{asset.symbol}</span>
          </div>
        )}
        {typeof asset.quantity === 'number' && (asset.category === 'financial_instruments' || (asset.category === 'alternative_assets' && asset.asset_type_key === 'crypto')) && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">כמות:</span>
            <span className="font-medium" dir="ltr">{asset.quantity}</span>
          </div>
        )}
         {asset.category === 'savings_deposits' && asset.institution_name && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">מוסד:</span>
            <span className="font-medium">{asset.institution_name}</span>
          </div>
        )}
        {asset.category === 'pension_insurance' && asset.institution_name && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">גוף מנהל:</span>
            <span className="font-medium">{asset.institution_name}</span>
          </div>
        )}
        {asset.last_updated_manual && (
            <div className="flex justify-between">
                <span className="text-muted-foreground">עדכון אחרון:</span>
                <span className="font-medium">{formatDate(asset.last_updated_manual)}</span>
            </div>
        )}
      </CardContent>
      <CardFooter className="p-2 bg-muted/50 flex justify-end gap-1.5">
        <Button variant="ghost" size="icon-sm" onClick={() => onEdit(asset)} title="עריכה">
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={() => onDelete(asset)} title="מחיקה" className="text-destructive hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}