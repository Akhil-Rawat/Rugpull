import { useState } from "react";
import { motion } from "framer-motion";
import { getShieldFi, formatMON } from "../utils/contract";
import { TOKEN_ADDRESS, EXPLORER_URL } from "../config";
import { ethers } from "ethers";

export default function BuyCoverage({ wallet, onConnect, isConnecting }) {
  const [tokenAddress, setTokenAddress] = useState(TOKEN_ADDRESS);
  const [insuredAmount, setInsuredAmount] = useState("");
  const [premium, setPremium] = useState("0");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [policyId, setPolicyId] = useState(null);

  const handleAmountChange = async (value) => {
    setInsuredAmount(value);
    if (value && !isNaN(value)) {
      try {
        const contract = await getShieldFi(wallet?.signer);
        const parsedAmount = ethers.parseEther(value);
        const calculatedPremium = await contract.getPremiumForAmount(
          parsedAmount,
        );
        setPremium(ethers.formatEther(calculatedPremium));
      } catch (error) {
        console.error("Error calculating premium:", error);
      }
    } else {
      setPremium("0");
    }
  };

  const handleBuyCoverage = async (e) => {
    e.preventDefault();
    if (!wallet) {
      onConnect();
      return;
    }

    if (!insuredAmount || parseFloat(insuredAmount) <= 0) {
      setStatus({ type: "error", message: "Enter valid amount" });
      return;
    }

    setLoading(true);
    setStatus(null);
    setTxHash(null);
    setPolicyId(null);

    try {
      const contract = await getShieldFi(wallet.signer);
      const parsedAmount = ethers.parseEther(insuredAmount);
      const premiumAmount = ethers.parseEther(premium);

      setStatus({ type: "pending", message: "Confirming on Monad..." });

      const tx = await contract.buyCoverage(tokenAddress, parsedAmount, {
        value: premiumAmount,
      });

      const receipt = await tx.wait();

      const eventLog = receipt.logs
        .map((log) => {
          try {
            return contract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((event) => event && event.name === "CoveragePurchased");

      if (eventLog) {
        setPolicyId(eventLog.args[0].toString());
      }

      setTxHash(tx.hash);
      setStatus({
        type: "success",
        message: "✅ Coverage purchased!",
      });

      setInsuredAmount("");
      setPremium("0");
    } catch (error) {
      console.error("Error buying coverage:", error);
      setStatus({
        type: "error",
        message: error.reason || "Failed to buy coverage",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!wallet) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen pt-32 px-6"
      >
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200"
          >
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">🔐</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Connect Wallet
              </h2>
              <p className="text-gray-600">
                Connect your wallet to buy coverage
              </p>
            </div>

            <button
              onClick={onConnect}
              disabled={isConnecting}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen pt-32 px-6 pb-20"
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            Buy Coverage
          </h1>
          <p className="text-gray-600 text-lg">
            Protect your crypto from rug pulls and liquidity crashes
          </p>
        </motion.div>

        {/* Main Form Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200 mb-6"
        >
          <form onSubmit={handleBuyCoverage} className="space-y-6">
            {/* Token Address */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Token Address
              </label>
              <input
                type="text"
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-mono text-sm"
                placeholder="0x..."
              />
              <p className="text-xs text-gray-500 mt-2">
                Pre-filled: MockToken (ScamToken)
              </p>
            </div>

            {/* Insured Amount */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Amount to Insure (MON)
              </label>
              <input
                type="number"
                value={insuredAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-lg font-semibold"
                placeholder="2.0"
                min="0"
                step="0.01"
              />
            </div>

            {/* Premium Display */}
            {insuredAmount && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-700 font-medium">
                    Premium (10%)
                  </span>
                  <span className="text-2xl font-bold text-blue-600">
                    {premium} MON
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-gray-600">
                    ✓ <strong>Coverage:</strong> 48 hours
                  </div>
                  <div className="text-gray-600">
                    ✓ <strong>Threshold:</strong> 20% drop
                  </div>
                </div>
              </motion.div>
            )}

            {/* Status Messages */}
            {status && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg font-medium flex items-center gap-3 ${
                  status.type === "error"
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : status.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}
              >
                {status.type === "pending" && (
                  <span className="animate-spin">⏳</span>
                )}
                {status.type === "success" && <span>✅</span>}
                {status.type === "error" && <span>❌</span>}
                {status.message}
              </motion.div>
            )}

            {/* Policy ID */}
            {policyId && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 p-4 rounded-lg border border-green-200"
              >
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Policy ID:</strong> {policyId}
                </p>
                {txHash && (
                  <a
                    href={`${EXPLORER_URL}/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm inline-flex items-center gap-1"
                  >
                    View Transaction →
                  </a>
                )}
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !insuredAmount}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {loading ? "Processing..." : `Buy Coverage (${premium} MON)`}
            </button>
          </form>
        </motion.div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200"
        >
          <h3 className="font-bold text-gray-900 mb-4">How it Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-2xl mb-2">💳</div>
              <p className="text-sm text-gray-700">
                <strong>Buy Coverage</strong> - Pay 10% premium
              </p>
            </div>
            <div>
              <div className="text-2xl mb-2">📉</div>
              <p className="text-sm text-gray-700">
                <strong>Rug Detected</strong> - 20%+ drop triggers
              </p>
            </div>
            <div>
              <div className="text-2xl mb-2">💰</div>
              <p className="text-sm text-gray-700">
                <strong>Get Payout</strong> - Proportional to drop
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
