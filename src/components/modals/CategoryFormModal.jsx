import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AssetCategory } from '@/api/entities';
import { Loader2 } from 'lucide-react';

// Predefined colors for categories
const CATEGORY_COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Green', value: '#10b981' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Yellow', value: '#f59e0b' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Lime', value: '#84cc16' },
];

export default function CategoryFormModal({ 
  open, 
  onOpenChange, 
  category = null, 
  onCategoryAdded = () => {} 
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: CATEGORY_COLORS[0].value,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isNew, setIsNew] = useState(true);
  
  useEffect(() => {
    if (category) {
      setIsNew(false);
      setFormData({
        name: category.name || '',
        description: category.description || '',
        color: category.color || CATEGORY_COLORS[0].value,
      });
    } else {
      setIsNew(true);
      setFormData({
        name: '',
        description: '',
        color: CATEGORY_COLORS[0].value,
      });
    }
  }, [category]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleColorSelect = (color) => {
    setFormData((prev) => ({ ...prev, color }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Validate inputs
      if (!formData.name) {
        throw new Error('Category name is required');
      }
      
      // Check if editing existing category or creating new one
      if (!isNew) {
        // Find the category by name since we might not have the ID
        const categories = await AssetCategory.filter({ name: category.name });
        if (categories.length > 0) {
          await AssetCategory.update(categories[0].id, {
            name: formData.name,
            description: formData.description,
            color: formData.color,
          });
        } else {
          // Category name changed, create new
          await AssetCategory.create(formData);
        }
      } else {
        // Create new category
        await AssetCategory.create(formData);
      }
      
      onCategoryAdded();
      onOpenChange(false);
    } catch (err) {
      console.error('Error saving category:', err);
      setError(err.message || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isNew ? 'Add Category' : 'Edit Category'}</DialogTitle>
          <DialogDescription>
            {isNew 
              ? 'Create a new category for organizing your assets' 
              : 'Update the details of this category'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g. Stocks, Crypto, Bonds"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="What kind of assets belong in this category?"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="grid grid-cols-5 gap-2">
              {CATEGORY_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`w-full aspect-square rounded-full border-2 ${
                    formData.color === color.value ? 'border-primary' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => handleColorSelect(color.value)}
                  title={color.name}
                />
              ))}
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
              {isNew ? 'Add Category' : 'Update Category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}