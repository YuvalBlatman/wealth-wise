import React, { useState, useEffect } from 'react';
import { Asset } from '@/api/entities';
import { AssetType } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Plus, Briefcase as StudyFundIcon, Landmark, ShieldCheck, Box, Building, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Added Card imports

import SummaryWidget from '../components/dashboard/SummaryWidget';
import AssetList from '../components/common/AssetList';
import PortfolioCharts from '../components/dashboard/PortfolioCharts';

// Import all forms
import FinancialAssetForm from '../components/forms/FinancialAssetForm';
import SavingsForm from '../components/forms/SavingsForm';
import PensionForm from '../components/forms/PensionForm';
import AlternativeForm from '../components/forms/AlternativeForm';
import RealEstateForm from '../components/forms/RealEstateForm';
import StudyFundForm from '../components/forms/StudyFundForm'; 

// Category definitions
const CATEGORIES = {
  financial_instruments: { key: "financial_instruments", name_he: "מכשירים פיננסיים", IconComponent: TrendingUp, FormComponent: FinancialAssetForm },
  savings_deposits: { key: "savings_deposits", name_he: "חסכונות ופקדונות", IconComponent: Landmark, FormComponent: SavingsForm },
  pension_insurance: { key: "pension_insurance", name_he: "פנסיה וביטוח", IconComponent: ShieldCheck, FormComponent: PensionForm },
  study_funds: { key: "study_funds", name_he: "קרנות השתלמות", IconComponent: StudyFundIcon, FormComponent: StudyFundForm },
  alternative_assets: { key: "alternative_assets", name_he: "נכסים אלטרנטיביים", IconComponent: Box, FormComponent: AlternativeForm },
  real_estate: { key: "real_estate", name_he: "נדל\"ן", IconComponent: Building, FormComponent: RealEstateForm }
};

export default function Dashboard() {
  const [assets, setAssets] = useState([]);
  const [assetTypes, setAssetTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showFormModal, setShowFormModal] = useState(false);
  const [currentFormCategoryKey, setCurrentFormCategoryKey] = useState(null);
  const [editingAsset, setEditingAsset] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [assetsData, assetTypesData] = await Promise.all([
        Asset.list('-created_date'),
        AssetType.list()
      ]);
      setAssets(assetsData);
      setAssetTypes(assetTypesData);
    } catch (error) {
      console.error('שגיאה בטעינת נתונים ראשוניים:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAsset = (categoryKey) => {
    setEditingAsset(null);
    setCurrentFormCategoryKey(categoryKey);
    setShowFormModal(true);
  };

  const handleEditAsset = (asset) => {
    setEditingAsset(asset);
    setCurrentFormCategoryKey(asset.category);
    setShowFormModal(true);
  };

  const handleDeleteAsset = async (asset) => {
    if (window.confirm(`האם אתה בטוח שברצונך למחוק את הנכס "${asset.description}"?`)) {
      try {
        await Asset.delete(asset.id);
        await loadInitialData(); // Reload data after delete
      } catch (error) {
        console.error('שגיאה במחיקת נכס:', error);
        alert('שגיאה במחיקת הנכס. אנא נסה שנית.');
      }
    }
  };


  const handleSaveAsset = async () => {
    setShowFormModal(false);
    setEditingAsset(null);
    setCurrentFormCategoryKey(null);
    await loadInitialData(); // Reload data after save
  };
  
  const CurrentFormComponent = currentFormCategoryKey ? CATEGORIES[currentFormCategoryKey]?.FormComponent : null;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8" dir="rtl">
      <SummaryWidget assets={assets} />
      <PortfolioCharts assets={assets} />

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {Object.values(CATEGORIES).map(({ key, name_he, IconComponent }) => (
          <Card key={key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold flex items-center">
                {IconComponent && <IconComponent className="w-5 h-5 ml-2 text-primary" />}
                {name_he}
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => handleAddAsset(key)}>
                <Plus className="h-4 w-4 ml-1" />
                הוסף נכס
              </Button>
            </CardHeader>
            <CardContent>
              <AssetList
                assets={assets.filter(asset => asset.category === key)}
                assetTypes={assetTypes.filter(type => type.category_key === key)}
                onEditAsset={handleEditAsset}
                onDeleteAsset={handleDeleteAsset}
                categoryKey={key}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {showFormModal && CurrentFormComponent && currentFormCategoryKey && (
        <Dialog open={showFormModal} onOpenChange={(isOpen) => {
            if (!isOpen) {
                setEditingAsset(null);
                setCurrentFormCategoryKey(null);
            }
            setShowFormModal(isOpen);
          }}
        >
          <DialogContent className="sm:max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle>
                {editingAsset ? 'עריכת נכס' : `הוספת נכס חדש: ${CATEGORIES[currentFormCategoryKey]?.name_he}`}
              </DialogTitle>
              <DialogDescription>
                {editingAsset ? 'עדכן את פרטי הנכס.' : `מלא את פרטי הנכס עבור קטגוריית ${CATEGORIES[currentFormCategoryKey]?.name_he}.`}
              </DialogDescription>
            </DialogHeader>
            <CurrentFormComponent
              asset={editingAsset}
              assetTypesForCategory={assetTypes.filter(type => type.category_key === currentFormCategoryKey)}
              onSave={handleSaveAsset}
              onCancel={() => {
                setShowFormModal(false);
                setEditingAsset(null);
                setCurrentFormCategoryKey(null);
              }}
              onClose={() => {
                setShowFormModal(false);
                setEditingAsset(null);
                setCurrentFormCategoryKey(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}