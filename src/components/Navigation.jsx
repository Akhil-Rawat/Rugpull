import React from "react";
import { motion } from "framer-motion";

const Navigation = ({ wallet, onConnect, onDisconnect, activeTab, onTabChange, tabs }) => {
  return (
    <nav className="fixed top-0 w-full bg-gray-100 z-50 border-b-4 border-green-900">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-6">
        {/* Logo + Brand */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 min-w-fit"
        >
          <div>
            <h2 className="font-bold text-base text-green-900 font-mono tracking-wider">SHIELDFI</h2>
            <p className="text-xs text-green-700 font-mono">DEFI INSURANCE</p>
          </div>
        </motion.div>

        {/* Tab Navigation - CENTER */}
        {tabs && onTabChange && (
          <div className="flex gap-1 flex-1 justify-center">
            {tabs
              .filter((tab) => tab.show)
              .map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`px-4 py-2 font-mono text-sm font-bold whitespace-nowrap border-3 transition-all uppercase tracking-wider ${
                    activeTab === tab.id
                      ? "bg-green-900 text-white border-green-900"
                      : "bg-transparent text-green-900 border-green-900 hover:bg-green-50"
                  }`}
                  whileHover={{ scale: 1.05 }}
                >
                  {tab.label}
                </motion.button>
              ))}
          </div>
        )}

        {/* Wallet Button - RIGHT */}
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={wallet ? onDisconnect : onConnect}
          className="px-4 py-2 font-mono text-sm font-bold border-3 border-green-900 bg-green-900 text-white whitespace-nowrap uppercase tracking-wider transition-all min-w-fit hover:bg-green-800"
        >
          {wallet
            ? `✓ ${wallet.slice(0, 6)}...${wallet.slice(-4)}`
            : "CONNECT WALLET"}
        </motion.button>
      </div>
    </nav>
  );
};

export default Navigation;
