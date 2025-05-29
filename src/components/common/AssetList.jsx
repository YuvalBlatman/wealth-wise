
import React from 'react';
import AssetCard from './AssetCard';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { getCategoryNameHebrew, formatCurrency } from '@/components/utils/formatters';


export default function AssetList({
  assets = [],
  assetTypes = [], // Make sure this is passed from Dashboard
  onEditAsset,
  onDeleteAsset,
  categoryKey // This prop indicates which specific category this list is for, if not for "all"
}) {
  if (!assets || assets.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground" dir="rtl">
        <AlertTriangle className="mx-auto h-10 w-10 text-gray-400 mb-3" />
        <p>לא נוספו נכסים לקטגוריה זו עדיין.</p>
        <p className="text-sm">לחץ על "הוסף נכס" כדי להתחיל.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {assets.map((asset) => {
        const currentAssetType = assetTypes.find(
          at => at.type_key === asset.asset_type_key && at.category_key === asset.category
        );
        return (
          <AssetCard
            key={asset.id}
            asset={asset}
            assetType={currentAssetType} // Pass the found assetType object
            onEdit={onEditAsset}
            onDelete={onDeleteAsset}
          />
        );
      })}
    </div>
  );
}
