
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { 
  Home,
  LayoutDashboard, 
  Landmark, 
  Briefcase, 
  ShieldCheck, 
  Box,
  Building, // For Real Estate
  FileText as StudyFundIcon, // For Study Funds
  DollarSign, // For financial instruments / general finance
  Settings,
  Menu, 
  X,
  Sun,
  Moon,
  LogOut,
  TrendingUp, // For Liquidity
  BarChart2, // For Analytics
  Database // For Economic Data
} from "lucide-react";

const NAV_ITEMS = [
  { name: "סקירה כללית", page: "Dashboard", icon: LayoutDashboard },
  { name: "נזילות", page: "Liquidity", icon: TrendingUp },
  { name: "נתונים כלכליים", page: "EconomicDataPage", icon: Database },
  // { name: "ניתוחים", page: "Analytics", icon: BarChart2 }, // Can be added later
  // { name: "יעדים", page: "Goals", icon: Target }, // Can be added later
];


export default function Layout({ children, currentPageName }) {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  const toggleDarkMode = () => setDarkMode(!darkMode);
  const handleLogout = async () => {
    await User.logout();
    navigate(createPageUrl('Login')); // Assuming you have a login page or will handle this
    window.location.reload();
  };
  const isActive = (page) => currentPageName === page;

  const getHeaderTitle = () => {
    const currentNavItem = NAV_ITEMS.find(item => item.page === currentPageName);
    return currentNavItem ? currentNavItem.name : "מנהל הנכסים האישי"; 
  };

  return (
    <div className={`h-screen flex flex-col ${darkMode ? "dark" : ""} font-sans`} dir="rtl">
      <style jsx global>{`
        :root {
          --background: 0 0% 100%;
          --foreground: 222.2 84% 4.9%;
          --card: 0 0% 100%;
          --card-foreground: 222.2 84% 4.9%;
          --popover: 0 0% 100%;
          --popover-foreground: 222.2 84% 4.9%;
          --primary: 217.2 91.2% 59.8%;
          --primary-foreground: 210 40% 98%;
          --secondary: 210 40% 96.1%;
          --secondary-foreground: 222.2 47.4% 11.2%;
          --muted: 210 40% 96.1%;
          --muted-foreground: 215.4 16.3% 46.9%;
          --accent: 210 40% 96.1%;
          --accent-foreground: 222.2 47.4% 11.2%;
          --destructive: 0 84.2% 60.2%;
          --destructive-foreground: 210 40% 98%;
          --border: 214.3 31.8% 91.4%;
          --input: 214.3 31.8% 91.4%;
          --ring: 217.2 91.2% 59.8%;
          --radius: 0.5rem;
        }

        .dark {
          --background: 222.2 84% 4.9%;
          --foreground: 210 40% 98%;
          --card: 222.2 84% 4.9%;
          --card-foreground: 210 40% 98%;
          --popover: 222.2 84% 4.9%;
          --popover-foreground: 210 40% 98%;
          --primary: 217.2 91.2% 59.8%;
          --primary-foreground: 222.2 47.4% 11.2%;
          --secondary: 217.2 32.6% 17.5%;
          --secondary-foreground: 210 40% 98%;
          --muted: 217.2 32.6% 17.5%;
          --muted-foreground: 215 20.2% 65.1%;
          --accent: 217.2 32.6% 17.5%;
          --accent-foreground: 210 40% 98%;
          --destructive: 0 62.8% 30.6%;
          --destructive-foreground: 210 40% 98%;
          --border: 217.2 32.6% 17.5%;
          --input: 217.2 32.6% 17.5%;
          --ring: 224.3 76.5% 48%;
        }

        body {
          background-color: hsl(var(--background));
          color: hsl(var(--foreground));
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
      `}</style>
      
      <header className="md:hidden border-b border-border flex items-center px-4 h-14 bg-background">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="font-semibold text-lg mx-auto">{getHeaderTitle()}</h1>
        <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside 
          className={`
            bg-card border-l border-border w-72 flex-shrink-0 flex flex-col transition-transform z-30
            ${isMobile ? "fixed inset-y-0 right-0 transform" : ""}
            ${isMobile && !sidebarOpen ? "translate-x-full" : "translate-x-0"}
          `}
        >
          <div className="h-14 border-b border-border flex items-center px-4 justify-between">
            <div className="flex items-center">
              <DollarSign className="h-7 w-7 text-primary mr-3" />
              <span className="font-bold text-xl">מנהל הנכסים</span>
            </div>
            {isMobile && (
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>

          <nav className="flex-1 overflow-auto py-4 px-3">
            <div className="space-y-2">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-base transition-all hover:bg-accent ${isActive(item.page) ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground"}`}
                  onClick={() => isMobile && setSidebarOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          </nav>

          <div className="border-t border-border p-4">
            <div className="flex items-center justify-between">
              {!isMobile && (
                <Button variant="ghost" size="icon" onClick={toggleDarkMode} title={darkMode ? "מצב בהיר" : "מצב כהה"}>
                  {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>
              )}
              {/* Settings button can be re-added if settings page exists */}
              {/* <Button variant="ghost" size="icon" title="הגדרות">
                <Settings className="h-5 w-5" />
              </Button> */}
              <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={handleLogout} title="התנתקות">
                <LogOut className="h-5 w-5" />
                {!isMobile && <span>התנתקות</span>}
              </Button>
            </div>
          </div>
        </aside>

        {isMobile && sidebarOpen && (
          <div className="fixed inset-0 bg-black/20 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <main className="flex-1 overflow-auto bg-background">
          <header className="hidden md:flex h-14 items-center gap-4 border-b border-border bg-background px-6 sticky top-0 z-10">
            <h1 className="font-semibold text-xl">{getHeaderTitle()}</h1>
          </header>
          
          <div className="p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
