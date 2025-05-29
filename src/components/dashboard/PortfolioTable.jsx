import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/components/utils/format-utils';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronDown,
  ExternalLink,
  MoreHorizontal,
  PencilIcon,
  Plus,
  Trash2Icon,
} from 'lucide-react';
import { Asset } from '@/api/entities';

export default function PortfolioTable({ 
  assets, 
  categories, 
  onRefreshData,
  onOpenCategoryModal,
  onOpenAssetModal
}) {
  const navigate = useNavigate();
  const [expandedCategories, setExpandedCategories] = useState([]);

  const toggleCategory = (category) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };

  // Group assets by category
  const assetsByCategory = assets.reduce((acc, asset) => {
    const category = asset.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(asset);
    return acc;
  }, {});

  // Calculate category totals
  const categoryTotals = Object.entries(assetsByCategory).reduce((acc, [category, assets]) => {
    const total = assets.reduce((sum, asset) => sum + (asset.quantity * (asset.current_price || 0)), 0);
    const dailyChange = assets.reduce((sum, asset) => {
      const value = asset.quantity * (asset.current_price || 0);
      return sum + (value * (asset.daily_change_percent || 0) / 100);
    }, 0);
    
    acc[category] = { 
      total, 
      dailyChange,
      percentChange: total > 0 ? (dailyChange / total) * 100 : 0
    };
    return acc;
  }, {});

  const viewAssetDetails = (assetId) => {
    navigate(createPageUrl(`Asset?id=${assetId}`));
  };

  const editAsset = (asset) => {
    onOpenAssetModal(asset);
  };

  const deleteAsset = async (assetId) => {
    if (confirm("Are you sure you want to delete this asset?")) {
      try {
        await Asset.delete(assetId);
        onRefreshData();
      } catch (error) {
        console.error("Error deleting asset:", error);
      }
    }
  };

  const getCategoryColor = (category) => {
    const categoryObj = categories.find(c => c.name === category);
    return categoryObj?.color || '#3b82f6';
  };

  return (
    <Card className="col-span-3">
      <CardHeader className="flex flex-row items-center">
        <div className="flex-1">
          <CardTitle>Your Portfolio</CardTitle>
          <CardDescription>
            Manage your investment portfolio
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            size="sm"
            onClick={() => onOpenCategoryModal()}
          >
            Categories
          </Button>
          <Button 
            size="sm"
            onClick={() => onOpenAssetModal()}
          >
            <Plus className="h-4 w-4 mr-1" />
            New Asset
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Category</TableHead>
                <TableHead>Symbol / Name</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Current Value</TableHead>
                <TableHead className="text-right">Daily Change</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.keys(assetsByCategory).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    No assets found. Add your first investment!
                  </TableCell>
                </TableRow>
              ) : (
                Object.entries(assetsByCategory).map(([category, categoryAssets]) => {
                  const isExpanded = expandedCategories.includes(category);
                  const { total, percentChange } = categoryTotals[category];
                  
                  return (
                    <React.Fragment key={category}>
                      {/* Category row */}
                      <TableRow 
                        className="group cursor-pointer hover:bg-muted/50" 
                        onClick={() => toggleCategory(category)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <div 
                              className="w-2 h-2 rounded-full mr-2" 
                              style={{ backgroundColor: getCategoryColor(category) }}
                            />
                            <ChevronDown 
                              className={`h-4 w-4 mr-1 transition-transform ${
                                isExpanded ? "transform rotate-180" : ""
                              }`}
                            />
                            {category}
                          </div>
                        </TableCell>
                        <TableCell colSpan={2}>{categoryAssets.length} assets</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(total)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className={`inline-flex items-center ${
                            percentChange > 0 ? "text-green-500" : 
                            percentChange < 0 ? "text-red-500" : "text-muted-foreground"
                          }`}>
                            {percentChange > 0 ? (
                              <ArrowUpIcon className="h-4 w-4 mr-1" />
                            ) : percentChange < 0 ? (
                              <ArrowDownIcon className="h-4 w-4 mr-1" />
                            ) : null}
                            {Math.abs(percentChange).toFixed(2)}%
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenCategoryModal({ name: category });
                            }}
                            className="opacity-0 group-hover:opacity-100"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      
                      {/* Asset rows (when category is expanded) */}
                      {isExpanded && categoryAssets.map((asset) => {
                        const value = asset.quantity * (asset.current_price || 0);
                        return (
                          <TableRow 
                            key={asset.id}
                            className="bg-muted/30 hover:bg-muted"
                          >
                            <TableCell></TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium flex items-center">
                                  {asset.symbol}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 ml-1 rounded-full p-0"
                                    onClick={() => viewAssetDetails(asset.id)}
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {asset.name || 'Unknown Asset'}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{asset.quantity}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(value)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className={`inline-flex items-center ${
                                asset.daily_change_percent > 0 ? "text-green-500" : 
                                asset.daily_change_percent < 0 ? "text-red-500" : "text-muted-foreground"
                              }`}>
                                {asset.daily_change_percent > 0 ? (
                                  <ArrowUpIcon className="h-4 w-4 mr-1" />
                                ) : asset.daily_change_percent < 0 ? (
                                  <ArrowDownIcon className="h-4 w-4 mr-1" />
                                ) : null}
                                {Math.abs(asset.daily_change_percent || 0).toFixed(2)}%
                              </div>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => viewAssetDetails(asset.id)}>
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => editAsset(asset)}>
                                    Edit Asset
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => deleteAsset(asset.id)}
                                  >
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}