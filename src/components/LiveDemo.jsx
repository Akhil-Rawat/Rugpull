import { useState, useEffect } from "react";
import { getReadShieldFi, formatMON } from "../utils/contract";
import ShieldFiABI from "../abi/ShieldFi.json";
import { TOKEN_ADDRESS, EXPLORER_URL, CONTRACT_ADDRESS } from "../config";
import { ethers } from "ethers";

export default function LiveDemo({ wallet }) {
  const [liquidityPercent, setLiquidityPercent] = useState(100);
  const [rugDetected, setRugDetected] = useState(false);
  const [dropPercent, setDropPercent] = useState(0);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [simulatingRug, setSimulatingRug] = useState(false);
  const [claimingDemo, setClaimingDemo] = useState(false);
  const [eligiblePolicies, setEligiblePolicies] = useState(0);
  const [claimStatus, setClaimStatus] = useState(null);
  const [claimTime, setClaimTime] = useState(null);
  const [claimTxHash, setClaimTxHash] = useState(null);

  useEffect(() => {
    fetchInitialData();
    setupEventListeners();
  }, []);

  const fetchInitialData = async () => {
    try {
      const provider = new ethers.JsonRpcProvider(
        "https://testnet-rpc.monad.xyz",
      );
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        ShieldFiABI,
        provider,
      );
      const tokenRisk = await contract.getTokenRisk(TOKEN_ADDRESS);

      setRugDetected(tokenRisk.rugDetected);

      let dropPercent = 0;
      let liquidityPercent = 100;

      if (
        tokenRisk.initialLiquidity > 0 &&
        tokenRisk.lastCheckedLiquidity < tokenRisk.initialLiquidity
      ) {
        dropPercent = Math.floor(
          ((tokenRisk.initialLiquidity - tokenRisk.lastCheckedLiquidity) *
            10000) /
            tokenRisk.initialLiquidity,
        );
        liquidityPercent = 100 - dropPercent / 100;
      }

      setDropPercent((dropPercent / 100).toFixed(2));
      setLiquidityPercent(liquidityPercent);
    } catch (error) {
      console.error("Error fetching initial data:", error);
    }
  };

  const setupEventListeners = async () => {
    try {
      const provider = new ethers.JsonRpcProvider(
        "https://testnet-rpc.monad.xyz",
      );
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        ShieldFiABI,
        provider,
      );

      const handleRugSimulated = (tokenAddress) => {
        setLiquidityPercent(5);
        setRugDetected(true);
        setDropPercent("95.00");

        const timestamp = new Date().toLocaleTimeString();
        setEvents((prev) => [
          {
            id: Math.random(),
            type: "RugSimulated",
            message: "🚨 RUG DETECTED — 95% drop",
            emoji: "🚨",
            timestamp,
          },
          ...prev.slice(0, 9),
        ]);
      };

      const handleLiquidityUpdated = (
        tokenAddress,
        newLiquidity,
        dropPercent,
      ) => {
        const timestamp = new Date().toLocaleTimeString();

        if (Number(dropPercent) >= 8000) {
          setLiquidityPercent(5);
          setRugDetected(true);
          setDropPercent((Number(dropPercent) / 100).toFixed(2));

          setEvents((prev) => [
            {
              id: Math.random(),
              type: "LiquidityUpdated",
              message: `📉 Liquidity updated: ${formatMON(newLiquidity)}`,
              emoji: "📉",
              timestamp,
            },
            ...prev.slice(0, 9),
          ]);
        } else {
          setLiquidityPercent(100 - Number(dropPercent) / 100);
          setDropPercent((Number(dropPercent) / 100).toFixed(2));

          setEvents((prev) => [
            {
              id: Math.random(),
              type: "LiquidityUpdated",
              message: `📉 Liquidity updated: ${formatMON(newLiquidity)}`,
              emoji: "📉",
              timestamp,
            },
            ...prev.slice(0, 9),
          ]);
        }
      };

      const handlePayoutClaimed = (policyId, holder, amount) => {
        const timestamp = new Date().toLocaleTimeString();
        setEvents((prev) => [
          {
            id: Math.random(),
            type: "PayoutClaimed",
            message: `✅ Payout: ${formatMON(amount)} → ${holder.slice(
              0,
              6,
            )}...${holder.slice(-4)}`,
            emoji: "✅",
            timestamp,
          },
          ...prev.slice(0, 9),
        ]);
      };

      contract.on("RugSimulated", handleRugSimulated);
      contract.on("LiquidityUpdated", handleLiquidityUpdated);
      contract.on("PayoutClaimed", handlePayoutClaimed);

      return () => {
        contract.off("RugSimulated", handleRugSimulated);
        contract.off("LiquidityUpdated", handleLiquidityUpdated);
        contract.off("PayoutClaimed", handlePayoutClaimed);
      };
    } catch (error) {
      console.error("Failed to setup event listeners:", error);
    }
  };

  const handleSimulateRugPull = async () => {
    setSimulatingRug(true);

    try {
      if (!wallet) {
        alert("Please connect wallet to simulate rug pull");
        setSimulatingRug(false);
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        ShieldFiABI,
        signer,
      );

      const tx = await contract.simulateRugPull(TOKEN_ADDRESS);
      console.log("Transaction sent:", tx.hash);

      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);

      // Manually trigger UI update
      setLiquidityPercent(5);
      setRugDetected(true);
      setDropPercent("95.00");

      const timestamp = new Date().toLocaleTimeString();
      setEvents((prev) => [
        {
          id: Math.random(),
          type: "RugSimulated",
          message: "🚨 RUG DETECTED — 95% drop",
          emoji: "🚨",
          timestamp,
        },
        ...prev.slice(0, 9),
      ]);
    } catch (error) {
      console.error("Error simulating rug pull:", error);
      alert(error.message || "Failed to simulate rug pull");
    } finally {
      setSimulatingRug(false);
    }
  };

  const handleClaimDemo = async () => {
    setClaimingDemo(true);
    setClaimStatus(null);
    setClaimTxHash(null);
    setClaimTime(null);

    try {
      if (!wallet) {
        alert("Please connect wallet to claim demo payout");
        setClaimingDemo(false);
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        ShieldFiABI,
        signer,
      );

      const policies = await contract.getUserPolicies(wallet.address);

      if (policies.length === 0) {
        alert(
          "No policies found. Please buy coverage first in the 'Buy Coverage' tab.",
        );
        setClaimingDemo(false);
        return;
      }

      let claimablePolicy = null;
      for (const policyId of policies) {
        const policy = await contract.getPolicy(policyId);
        if (
          policy.active &&
          !policy.claimed &&
          policy.expiryTime > Date.now() / 1000
        ) {
          claimablePolicy = policyId;
          break;
        }
      }

      if (!claimablePolicy) {
        alert("No claimable policies found");
        setClaimingDemo(false);
        return;
      }

      setClaimStatus("Processing claim...");
      const startTime = Date.now();

      const tx = await contract.claimPayout(claimablePolicy);
      const receipt = await tx.wait();

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      const policy = await contract.getPolicy(claimablePolicy);

      setClaimTime(elapsed);
      setClaimTxHash(tx.hash);
      setClaimStatus("success");

      const timestamp = new Date().toLocaleTimeString();
      setEvents((prev) => [
        {
          id: Math.random(),
          type: "PayoutClaimed",
          message: `✅ Payout: ${formatMON(policy.insuredAmount)} claimed!`,
          emoji: "✅",
          timestamp,
        },
        ...prev.slice(0, 9),
      ]);
    } catch (error) {
      console.error("Error claiming demo payout:", error);
      setClaimStatus("error: " + (error.message || "Failed to claim"));
    } finally {
      setClaimingDemo(false);
    }
  };

  return (
    <div>
      <div className="hero">
        <h1>Live Demo</h1>
        <p>Interact with ShieldFi in real-time</p>
      </div>

      <div className="demo-container">
        <div>
          <h3 style={{ marginBottom: "20px" }}>Simulate Rug Pull</h3>

          <div className="card">
            <div style={{ marginBottom: "16px" }}>
              <div
                style={{
                  fontSize: "13px",
                  marginBottom: "8px",
                  fontWeight: "900",
                  fontFamily: "Courier Prime, monospace",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "white",
                }}
              >
                SCAMTOKEN (SCAM)
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "rgba(255, 255, 255, 0.7)",
                  marginBottom: "12px",
                  wordBreak: "break-all",
                  fontFamily: "Courier Prime, monospace",
                  letterSpacing: "0.05em",
                }}
              >
                {TOKEN_ADDRESS}
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                  fontSize: "12px",
                  fontFamily: "Courier Prime, monospace",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  color: "white",
                }}
              >
                <span>CURRENT LIQUIDITY</span>
                <span style={{ fontWeight: "900" }}>
                  {liquidityPercent.toFixed(1)}%
                </span>
              </div>
              <div className="liquidity-bar-outer">
                <div
                  className="liquidity-bar-inner"
                  style={{
                    width: liquidityPercent + "%",
                  }}
                ></div>
              </div>
            </div>

            <button
              className="btn-red"
              onClick={handleSimulateRugPull}
              disabled={simulatingRug}
              style={{
                width: "100%",
                marginBottom: "16px",
                animation:
                  simulatingRug || rugDetected ? "pulse 1s infinite" : "none",
              }}
            >
              {simulatingRug ? "SIMULATING..." : "🚨 SIMULATE RUG PULL"}
            </button>

            {rugDetected && (
              <div
                className="rug-detected-text"
                style={{ animation: "shake 0.5s" }}
              >
                RUG DETECTED
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "12px",
                fontSize: "12px",
                marginTop: "20px",
                padding: "12px",
                background: "rgba(255, 255, 255, 0.1)",
                border: "2px solid rgba(255, 255, 255, 0.3)",
                fontFamily: "Courier Prime, monospace",
                fontWeight: "700",
                color: "white",
              }}
            >
              <div>
                <span
                  style={{
                    color: "rgba(255, 255, 255, 0.7)",
                    fontSize: "10px",
                    textTransform: "uppercase",
                  }}
                >
                  DROP
                </span>
                <div
                  style={{
                    fontWeight: "900",
                    marginTop: "4px",
                    fontSize: "14px",
                  }}
                >
                  {dropPercent}%
                </div>
              </div>
              <div>
                <span
                  style={{
                    color: "rgba(255, 255, 255, 0.7)",
                    fontSize: "10px",
                    textTransform: "uppercase",
                  }}
                >
                  THRESHOLD
                </span>
                <div
                  style={{
                    fontWeight: "900",
                    marginTop: "4px",
                    fontSize: "14px",
                  }}
                >
                  80%
                </div>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <span
                  style={{
                    color: "rgba(255, 255, 255, 0.7)",
                    fontSize: "10px",
                    textTransform: "uppercase",
                  }}
                >
                  STATUS
                </span>
                <div
                  style={{
                    fontWeight: "900",
                    marginTop: "4px",
                    fontSize: "14px",
                  }}
                >
                  {rugDetected ? (
                    <span style={{ color: "#dc2626" }}>RUG CONFIRMED</span>
                  ) : (
                    <span style={{ color: "#16a34a" }}>NO RUG</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 style={{ marginBottom: "20px", color: "white" }}>
            LIVE EVENT FEED
          </h3>

          <div
            className="card"
            style={{ maxHeight: "400px", overflowY: "auto" }}
          >
            {events.length === 0 ? (
              <p
                style={{
                  color: "rgba(255, 255, 255, 0.7)",
                  fontSize: "12px",
                  textAlign: "center",
                  fontFamily: "Courier Prime, monospace",
                  fontWeight: "700",
                }}
              >
                EVENTS WILL APPEAR HERE
              </p>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="event-card slide-in"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "8px",
                  }}
                >
                  <div style={{ fontFamily: "Courier Prime, monospace" }}>
                    <div
                      style={{
                        fontWeight: "700",
                        fontSize: "13px",
                        color: "white",
                      }}
                    >
                      {event.message}
                    </div>
                    <div className="event-timestamp">{event.timestamp}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="card" style={{ marginTop: "16px" }}>
            <h4
              style={{ marginBottom: "12px", fontSize: "1rem", color: "white" }}
            >
              INSTANT CLAIM DEMO
            </h4>

            {rugDetected && (
              <div style={{ marginBottom: "12px" }}>
                <div
                  style={{
                    fontSize: "12px",
                    color: "rgba(255, 255, 255, 0.7)",
                    fontFamily: "Courier Prime, monospace",
                    fontWeight: "700",
                    textTransform: "uppercase",
                  }}
                >
                  ELIGIBLE POLICIES: <strong>{eligiblePolicies}+</strong>
                </div>
              </div>
            )}

            <button
              className="btn-green"
              onClick={handleClaimDemo}
              disabled={claimingDemo || !rugDetected}
              style={{
                width: "100%",
                marginBottom: "12px",
              }}
            >
              {claimingDemo ? "PROCESSING..." : "💰 CLAIM PAYOUT"}
            </button>

            {claimTime && (
              <div
                style={{
                  background: "rgba(22, 163, 74, 0.2)",
                  border: "3px solid #16a34a",
                  borderRadius: "0",
                  padding: "12px",
                  fontSize: "12px",
                  color: "#16a34a",
                  fontFamily: "Courier Prime, monospace",
                  fontWeight: "700",
                  boxShadow: "none",
                }}
              >
                ✅ PAYOUT COMPLETED IN {claimTime}S
                {claimTxHash && (
                  <div style={{ marginTop: "8px" }}>
                    <a
                      href={`${EXPLORER_URL}/tx/${claimTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#16a34a",
                        textDecoration: "underline",
                        fontWeight: "900",
                        textTransform: "uppercase",
                      }}
                    >
                      VIEW TRANSACTION →
                    </a>
                  </div>
                )}
              </div>
            )}

            {claimStatus && !claimTime && (
              <div
                style={{
                  background: "rgba(220, 38, 38, 0.2)",
                  border: "3px solid #dc2626",
                  borderRadius: "0",
                  padding: "12px",
                  fontSize: "12px",
                  color: "#dc2626",
                  fontFamily: "Courier Prime, monospace",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  boxShadow: "none",
                }}
              >
                {claimStatus}
              </div>
            )}

            {!rugDetected && (
              <div
                style={{
                  fontSize: "12px",
                  color: "rgba(255, 255, 255, 0.7)",
                  padding: "12px",
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "2px solid rgba(255, 255, 255, 0.3)",
                  fontFamily: "Courier Prime, monospace",
                  fontWeight: "700",
                  textTransform: "uppercase",
                }}
              >
                SIMULATE A RUG PULL FIRST TO TEST CLAIMS
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: "30px", marginBottom: "40px" }}>
        <h3 style={{ marginBottom: "12px", color: "white" }}>
          HOW THE DEMO WORKS
        </h3>
        <ul
          style={{
            fontSize: "13px",
            color: "rgba(255, 255, 255, 0.9)",
            lineHeight: "1.8",
            fontFamily: "Courier Prime, monospace",
            fontWeight: "700",
            listStyle: "none",
          }}
        >
          <li style={{ marginBottom: "12px" }}>
            1️⃣ <strong>SIMULATE RUG:</strong> CLICK "SIMULATE RUG PULL" TO
            TRIGGER A 95% LIQUIDITY DROP
          </li>
          <li style={{ marginBottom: "12px" }}>
            2️⃣ <strong>WATCH DETECTION:</strong> THE PROTOCOL DETECTS THE DROP
            IN REAL-TIME AND EMITS EVENTS
          </li>
          <li style={{ marginBottom: "12px" }}>
            3️⃣ <strong>CLAIM REWARD:</strong> CLICK "CLAIM PAYOUT" TO RECEIVE
            INSURANCE ON ANY ACTIVE POLICY
          </li>
          <li>
            4️⃣ <strong>MONITOR SPEED:</strong> SEE ACTUAL TRANSACTION TIME ON
            MONAD TESTNET
          </li>
        </ul>
      </div>
    </div>
  );
}
