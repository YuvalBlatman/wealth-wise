import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Asset } from '@/api/entities';
import { Purchase } from '@/api/entities';
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
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/components/utils/format-utils';
import { 
  ArrowLeft, 
  ArrowUpIcon, 
  ArrowDownIcon, 
  Calendar, 
  CreditCard, 
  DollarSign, 
  Loader2, 
  Plus, 
  Trash2 
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import MarketDataFetcher from '../components/market-data/MarketDataFetcher';

export default function AssetPage() {
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseFormData, setPurchaseFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    quantity: '',
    price_per_unit: '',
    fees: '0',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const assetId = urlParams.get('id');
        
        if (!assetId) {
          navigate(createPageUrl('Dashboard'));
          return;
        }
        
        const assetData = await Asset.filter({ id: assetId });
        if (assetData.length === 0) {
          navigate(createPageUrl('Dashboard'));
          return;
        }
        
        setAsset(assetData[0]);
        
        const purchasesData = await Purchase.filter({ asset_id: assetId }, '-date');
        setPurchases(purchasesData);
      } catch (error) {
        console.error('Error loading asset data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [navigate]);
  
  const handleMarketDataUpdate = (data) => {
    if (data.length === 0 || !asset) return;
    
    // Find the data for this asset's symbol
    const assetData = data.find(d => d.symbol === asset.symbol);
    if (assetData) {
      setAsset(prev => ({
        ...prev,
        current_price: assetData.price,
        daily_change_percent: assetData.change_percent,
        name: assetData.name || prev.name
      }));
    }
  };
  
  const handlePurchaseFormChange = (e) => {
    const { name, value } = e.target;
    setPurchaseFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const addPurchase = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      if (!purchaseFormData.quantity || isNaN(Number(purchaseFormData.quantity))) {
        throw new Error('Quantity must be a valid number');
      }
      
      if (!purchaseFormData.price_per_unit || isNaN(Number(purchaseFormData.price_per_unit))) {
        throw new Error('Price must be a valid number');
      }
      
      const purchaseData = {
        asset_id: asset.id,
        date: purchaseFormData.date,
        quantity: Number(purchaseFormData.quantity),
        price_per_unit: Number(purchaseFormData.price_per_unit),
        fees: Number(purchaseFormData.fees || 0),
        notes: purchaseFormData.notes
      };
      
      await Purchase.create(purchaseData);
      
      // Update the asset's quantity
      const newQuantity = asset.quantity + purchaseData.quantity;
      await Asset.update(asset.id, { quantity: newQuantity });
      
      // Refresh data
      setAsset(prev => ({ ...prev, quantity: newQuantity }));
      const updatedPurchases = await Purchase.filter({ asset_id: asset.id }, '-date');
      setPurchases(updatedPurchases);
      
      // Reset form and close modal
      setPurchaseFormData({
        date: new Date().toISOString().split('T')[0],
        quantity: '',
        price_per_unit: '',
        fees: '0',
        notes: '',
      });
      setShowPurchaseModal(false);
    } catch (err) {
      console.error('Error adding purchase:', err);
      setError(err.message || 'Failed to add purchase');
    } finally {
      setSubmitting(false);
    }
  };
  
  const deletePurchase = async (purchaseId) => {
    if (!confirm('Are you sure you want to delete this purchase record?')) {
      return;
    }
    
    try {
      const purchase = purchases.find(p => p.id === purchaseId);
      await Purchase.delete(purchaseId);
      
      // Update the asset's quantity
      const newQuantity = Math.max(0, asset.quantity - purchase.quantity);
      await Asset.update(asset.id, { quantity: newQuantity });
      
      // Refresh data
      setAsset(prev => ({ ...prev, quantity: newQuantity }));
      const updatedPurchases = await Purchase.filter({ asset_id: asset.id }, '-date');
      setPurchases(updatedPurchases);
    } catch (error) {
      console.error('Error deleting purchase:', error);
      alert('Failed to delete purchase');
    }
  };
  
  // Calculate performance metrics
  const calculatePerformance = () => {
    if (!asset || !asset.current_price || purchases.length === 0) {
      return { averageCost: 0, totalCost: 0, totalValue: 0, totalROI: 0 };
    }
    
    const totalQuantity = asset.quantity;
    const totalCost = purchases.reduce((sum, p) => 
      sum + (p.quantity * p.price_per_unit) + (p.fees || 0), 0);
    const averageCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;
    const totalValue = totalQuantity * asset.current_price;
    const totalROI = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;
    
    return { averageCost, totalCost, totalValue, totalROI };
  };
  
  const performance = calculatePerformance();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!asset) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold">Asset not found</h2>
        <p className="text-muted-foreground mt-2">
          The asset you're looking for doesn't exist.
        </p>
        <Button 
          className="mt-4"
          onClick={() => navigate(createPageUrl('Dashboard'))}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <MarketDataFetcher
        symbols={[asset.symbol]}
        onDataFetched={handleMarketDataUpdate}
        interval={300000} // 5 minutes
      />
      
      <div className="flex items-center">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate(createPageUrl('Dashboard'))}
          className="mr-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">
          {asset.symbol}: {asset.name || 'Asset Details'}
        </h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Current Price</CardDescription>
            <CardTitle className="flex items-center text-2xl">
              <DollarSign className="h-5 w-5 text-muted-foreground mr-1" />
              {formatCurrency(asset.current_price || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`flex items-center text-sm ${
              asset.daily_change_percent > 0 ? 'text-green-500' : 
              asset.daily_change_percent < 0 ? 'text-red-500' : 'text-muted-foreground'
            }`}>
              {asset.daily_change_percent > 0 ? (
                <ArrowUpIcon className="h-4 w-4 mr-1" />
              ) : asset.daily_change_percent < 0 ? (
                <ArrowDownIcon className="h-4 w-4 mr-1" />
              ) : null}
              {Math.abs(asset.daily_change_percent || 0).toFixed(2)}% Today
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Holdings</CardDescription>
            <CardTitle className="text-2xl">
              {asset.quantity} {asset.symbol}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Value: {formatCurrency(asset.quantity * (asset.current_price || 0))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average Cost</CardDescription>
            <CardTitle className="flex items-center text-2xl">
              <CreditCard className="h-5 w-5 text-muted-foreground mr-1" />
              {formatCurrency(performance.averageCost)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Total Cost: {formatCurrency(performance.totalCost)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Return</CardDescription>
            <CardTitle className={`text-2xl ${
              performance.totalROI > 0 ? 'text-green-600' : 
              performance.totalROI < 0 ? 'text-red-600' : ''
            }`}>
              {performance.totalROI.toFixed(2)}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {formatCurrency(performance.totalValue - performance.totalCost)}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Purchase History</CardTitle>
            <CardDescription>
              Record of all your purchases for this asset
            </CardDescription>
          </div>
          <Button onClick={() => setShowPurchaseModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Purchase
          </Button>
        </CardHeader>
        <CardContent>
          {purchases.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No purchase records found.</p>
              <p className="text-sm mt-1">Add your first purchase to track your investment history.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                    <TableHead className="text-right">Current Value</TableHead>
                    <TableHead className="text-right">ROI</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map(purchase => {
                    const totalCost = (purchase.quantity * purchase.price_per_unit) + (purchase.fees || 0);
                    const currentValue = purchase.quantity * (asset.current_price || 0);
                    const roi = ((currentValue - totalCost) / totalCost) * 100;
                    
                    return (
                      <TableRow key={purchase.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
                            {format(parseISO(purchase.date), 'MMM d, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{purchase.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(purchase.price_per_unit)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(totalCost)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(currentValue)}</TableCell>
                        <TableCell className={`text-right ${
                          roi > 0 ? 'text-green-600' : roi < 0 ? 'text-red-600' : ''
                        }`}>
                          {roi.toFixed(2)}%
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deletePurchase(purchase.id)}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={showPurchaseModal} onOpenChange={setShowPurchaseModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Purchase</DialogTitle>
            <DialogDescription>
              Record a purchase of {asset.symbol} to your portfolio
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={addPurchase} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Purchase Date</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={purchaseFormData.date}
                  onChange={handlePurchaseFormChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  step="any"
                  value={purchaseFormData.quantity}
                  onChange={handlePurchaseFormChange}
                  placeholder="Amount purchased"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price_per_unit">Price Per Unit</Label>
                <Input
                  id="price_per_unit"
                  name="price_per_unit"
                  type="number"
                  step="any"
                  value={purchaseFormData.price_per_unit}
                  onChange={handlePurchaseFormChange}
                  placeholder="Price per share/unit"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fees">Fees (Optional)</Label>
                <Input
                  id="fees"
                  name="fees"
                  type="number"
                  step="any"
                  value={purchaseFormData.fees}
                  onChange={handlePurchaseFormChange}
                  placeholder="Transaction fees"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                name="notes"
                value={purchaseFormData.notes}
                onChange={handlePurchaseFormChange}
                placeholder="Any notes about this purchase"
              />
            </div>
            
            {error && (
              <div className="text-sm text-destructive">{error}</div>
            )}
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowPurchaseModal(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Purchase
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}