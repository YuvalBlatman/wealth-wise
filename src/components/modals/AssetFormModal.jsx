import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Asset } from '@/api/entities';
import { AssetCategory } from '@/api/entities';
import { Purchase } from '@/api/entities';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

export default function AssetFormModal({ 
  open, 
  onOpenChange, 
  asset = null, 
  categories = [], 
  onAssetAdded = () => {}
}) {
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    quantity: '',
    category: '',
    purchase_price: '',
    purchase_date: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (asset) {
      setFormData({
        symbol: asset.symbol || '',
        name: asset.name || '',
        quantity: asset.quantity || '',
        category: asset.category || '',
        purchase_price: '',
        purchase_date: new Date().toISOString().split('T')[0],
      });
    } else {
      setFormData({
        symbol: '',
        name: '',
        quantity: '',
        category: categories.length > 0 ? categories[0].name : '',
        purchase_price: '',
        purchase_date: new Date().toISOString().split('T')[0],
      });
    }
  }, [asset, categories]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleCategoryChange = (value) => {
    setFormData((prev) => ({ ...prev, category: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Validate inputs
      if (!formData.symbol) {
        throw new Error('Symbol is required');
      }
      
      if (!formData.quantity || isNaN(Number(formData.quantity)) || Number(formData.quantity) <= 0) {
        throw new Error('Quantity must be a positive number');
      }
      
      const quantity = Number(formData.quantity);
      
      if (asset) {
        // Update existing asset
        await Asset.update(asset.id, {
          symbol: formData.symbol.toUpperCase(),
          name: formData.name,
          quantity,
          category: formData.category,
        });
        
        // If purchase price is provided, add a new purchase record
        if (formData.purchase_price && !isNaN(Number(formData.purchase_price))) {
          await Purchase.create({
            asset_id: asset.id,
            date: formData.purchase_date,
            quantity,
            price_per_unit: Number(formData.purchase_price),
          });
        }
      } else {
        // Create new asset
        const newAsset = await Asset.create({
          symbol: formData.symbol.toUpperCase(),
          name: formData.name,
          quantity,
          category: formData.category,
        });
        
        // Create purchase record if price is provided
        if (formData.purchase_price && !isNaN(Number(formData.purchase_price))) {
          await Purchase.create({
            asset_id: newAsset.id,
            date: formData.purchase_date,
            quantity,
            price_per_unit: Number(formData.purchase_price),
          });
        }
      }
      
      onAssetAdded();
      onOpenChange(false);
    } catch (err) {
      console.error('Error saving asset:', err);
      setError(err.message || 'Failed to save asset');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{asset ? 'Edit Asset' : 'Add New Asset'}</DialogTitle>
          <DialogDescription>
            {asset 
              ? 'Update your asset details or add a new purchase' 
              : 'Add a new asset to your portfolio'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol</Label>
              <Input
                id="symbol"
                name="symbol"
                value={formData.symbol}
                onChange={handleInputChange}
                placeholder="AAPL"
                autoCapitalize="characters"
                dir="ltr"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Name (Optional)</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Apple Inc."
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                step="any"
                value={formData.quantity}
                onChange={handleInputChange}
                placeholder="10"
                dir="ltr"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.length > 0 ? (
                    categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="Stocks">Stocks</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchase_price">Purchase Price (Optional)</Label>
              <Input
                id="purchase_price"
                name="purchase_price"
                type="number"
                step="any"
                value={formData.purchase_price}
                onChange={handleInputChange}
                placeholder="150.00"
                dir="ltr"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="purchase_date">Purchase Date</Label>
              <Input
                id="purchase_date"
                name="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={handleInputChange}
                dir="ltr"
              />
            </div>
          </div>
          
          {error && (
            <div className="text-sm text-destructive">{error}</div>
          )}
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {asset ? 'Update Asset' : 'Add Asset'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}