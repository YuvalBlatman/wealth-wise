import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Asset from "./Asset";

import Goals from "./Goals";

import Analytics from "./Analytics";

import Liquidity from "./Liquidity";

import EconomicDataPage from "./EconomicDataPage";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Asset: Asset,
    
    Goals: Goals,
    
    Analytics: Analytics,
    
    Liquidity: Liquidity,
    
    EconomicDataPage: EconomicDataPage,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Asset" element={<Asset />} />
                
                <Route path="/Goals" element={<Goals />} />
                
                <Route path="/Analytics" element={<Analytics />} />
                
                <Route path="/Liquidity" element={<Liquidity />} />
                
                <Route path="/EconomicDataPage" element={<EconomicDataPage />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}