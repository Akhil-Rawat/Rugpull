import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navigation from "./components/Navigation";
import Hero from "./components/Hero";
import Dashboard from "./components/Dashboard";
import BuyCoverage from "./components/BuyCoverage";
import MyClaims from "./components/MyClaims";
import LiveDemo from "./components/LiveDemo";
import { connectWallet, truncateAddress } from "./utils/contract";

function App() {
  const [wallet, setWallet] = useState(null);
  const [activeTab, setActiveTab] = useState("home");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });

        if (accounts.length > 0) {
          const connected = await connectWallet();
          setWallet(connected);
        }
      }
    } catch (error) {
      console.log("Wallet not connected yet");
    }
  };

  const handleConnectWallet = async () => {
    setLoading(true);
    try {
      const connected = await connectWallet();
      setWallet(connected);
      setActiveTab("buy");
    } catch (error) {
      alert("Failed to connect wallet: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGetStarted = () => {
    if (wallet) {
      setActiveTab("buy");
    } else {
      handleConnectWallet();
    }
  };

  const handleDisconnect = () => {
    setWallet(null);
    setActiveTab("home");
  };

  const tabs = [
    { id: "home", label: "Home", show: true },
    { id: "dashboard", label: "Dashboard", show: wallet },
    { id: "buy", label: "Buy Coverage", show: wallet },
    { id: "claims", label: "My Claims", show: wallet },
    { id: "demo", label: "Live Demo", show: wallet },
  ];

  return (
    <div className="bg-white">
      <Navigation
        wallet={wallet?.address}
        onConnect={handleConnectWallet}
        onDisconnect={handleDisconnect}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={tabs}
      />

      <AnimatePresence mode="wait">
        {activeTab === "home" ? (
          <Hero
            key="hero"
            onGetStarted={handleGetStarted}
            wallet={wallet?.address}
          />
        ) : (
          <motion.main
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white"
          >
            {/* Tab Content */}
            <div className="pt-24">
              {activeTab === "dashboard" && <Dashboard wallet={wallet} />}
              {activeTab === "buy" && (
                <BuyCoverage
                  wallet={wallet}
                  onConnect={handleConnectWallet}
                  isConnecting={loading}
                />
              )}
              {activeTab === "claims" && (
                <MyClaims
                  wallet={wallet}
                  onConnect={handleConnectWallet}
                  isConnecting={loading}
                />
              )}
              {activeTab === "demo" && <LiveDemo wallet={wallet} />}
            </div>
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
