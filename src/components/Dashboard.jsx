import { useState, useEffect } from "react";
import { getReadShieldFi, formatMON } from "../utils/contract";
import { TOKEN_ADDRESS } from "../config";

export default function Dashboard() {
  const [stats, setStats] = useState({
    premiumPool: "0",
    policyCount: "0",
    initialLiquidity: "0",
    currentLiquidity: "0",
    dropPercent: "0",
    rugDetected: false,
  });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 15000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setupEventListeners();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const contract = await getReadShieldFi();

      const premiumPool = await contract.totalPremiumPool();
      const policyCount = await contract.policyCount();
      const tokenRisk = await contract.getTokenRisk(TOKEN_ADDRESS);

      let dropPercent = 0;
      if (
        tokenRisk.initialLiquidity > 0 &&
        tokenRisk.lastCheckedLiquidity < tokenRisk.initialLiquidity
      ) {
        dropPercent = Math.floor(
          ((tokenRisk.initialLiquidity - tokenRisk.lastCheckedLiquidity) *
            10000) /
            tokenRisk.initialLiquidity
        );
      }

      setStats({
        premiumPool: formatMON(premiumPool),
        policyCount: policyCount.toString(),
        initialLiquidity: formatMON(tokenRisk.initialLiquidity),
        currentLiquidity: formatMON(tokenRisk.lastCheckedLiquidity),
        dropPercent: (dropPercent / 100).toFixed(2),
        rugDetected: tokenRisk.rugDetected,
      });

      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setLoading(false);
    }
  };

  const setupEventListeners = async () => {
    try {
      const contract = await getReadShieldFi();

      const handleLiquidityUpdated = (tokenAddress, newLiquidity, dropPercent) => {
        const timestamp = new Date().toLocaleTimeString();
        setEvents((prev) => [
          {
            id: Math.random(),
            type: "LiquidityUpdated",
            message: `📉 Liquidity updated: ${formatMON(newLiquidity)}`,
            timestamp,
          },
          ...prev.slice(0, 9),
        ]);
      };

      const handleRugDetected = (tokenAddress, finalLiquidity, dropPercent) => {
        const timestamp = new Date().toLocaleTimeString();
        setEvents((prev) => [
          {
            id: Math.random(),
            type: "RugDetected",
            message: `🚨 RUG DETECTED — ${(dropPercent / 100).toFixed(2)}% drop`,
            timestamp,
          },
          ...prev.slice(0, 9),
        ]);
      };

      const handlePayoutClaimed = (policyId, holder, amount) => {
        const timestamp = new Date().toLocaleTimeString();
        setEvents((prev) => [
          {
            id: Math.random(),
            type: "PayoutClaimed",
            message: `✅ Payout: ${formatMON(amount)} → ${holder.slice(0, 6)}...${holder.slice(-4)}`,
            timestamp,
          },
          ...prev.slice(0, 9),
        ]);
      };

      contract.on("LiquidityUpdated", handleLiquidityUpdated);
      contract.on("RugDetected", handleRugDetected);
      contract.on("PayoutClaimed", handlePayoutClaimed);

      return () => {
        contract.off("LiquidityUpdated", handleLiquidityUpdated);
        contract.off("RugDetected", handleRugDetected);
        contract.off("PayoutClaimed", handlePayoutClaimed);
      };
    } catch (error) {
      console.error("Failed to setup event listeners:", error);
    }
  };

  if (loading) {
    return (
      <div className="hero">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const liquidityPercent = stats.rugDetected
    ? 5
    : 100 - Math.min(parseFloat(stats.dropPercent), 100);

  return (
    <div>
      <div className="hero">
        <h1>Dashboard</h1>
        <p>Real-time insurance protocol metrics on Monad Testnet</p>
      </div>

      <div className="grid grid-cols-3">
        <div className="card-stat">
          <div className="stat-label">Total Premium Pool</div>
          <div className="stat-value">{stats.premiumPool}</div>
          <div style={{ fontSize: "12px", color: "var(--green)" }}>
            Available Claims
          </div>
        </div>

        <div className="card-stat">
          <div className="stat-label">Total Policies</div>
          <div className="stat-value">{stats.policyCount}</div>
          <div style={{ fontSize: "12px", color: "var(--purple)" }}>
            Active Coverage
          </div>
        </div>

        <div className="card-stat">
          <div className="stat-label">Protocol Status</div>
          <div className="stat-value" style={{ color: "var(--green)" }}>
            Live
          </div>
          <div style={{ fontSize: "12px", color: "var(--green)" }}>
            On Monad
          </div>
        </div>
      </div>

      <div style={{ marginTop: "40px" }}>
        <h2 style={{ marginBottom: "20px" }}>Protected Tokens</h2>

        <div className="card">
          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "8px",
                fontSize: "13px",
              }}
            >
              <span>ScamToken (SCAM)</span>
              <span style={{ fontWeight: "500" }}>
                {liquidityPercent.toFixed(1)}%
              </span>
            </div>
            <div className="liquidity-bar-outer">
              <div
                className="liquidity-bar-inner"
                style={{ width: liquidityPercent + "%" }}
              ></div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "12px",
              fontSize: "13px",
            }}
          >
            <div>
              <span style={{ color: "var(--muted)" }}>Initial Liquidity</span>
              <div style={{ fontWeight: "500", marginTop: "4px" }}>
                {stats.initialLiquidity}
              </div>
            </div>
            <div>
              <span style={{ color: "var(--muted)" }}>Current Liquidity</span>
              <div style={{ fontWeight: "500", marginTop: "4px" }}>
                {stats.currentLiquidity}
              </div>
            </div>
            <div>
              <span style={{ color: "var(--muted)" }}>Price Drop</span>
              <div style={{ fontWeight: "500", marginTop: "4px" }}>
                {stats.dropPercent}%
              </div>
            </div>
            <div>
              <span style={{ color: "var(--muted)" }}>Status</span>
              <div
                style={{
                  fontWeight: "500",
                  marginTop: "4px",
                  display: "inline-block",
                }}
              >
                <span
                  className={
                    stats.rugDetected ? "badge-red" : "badge-green"
                  }
                  style={{
                    display: "inline-block",
                    padding: "4px 8px",
                  }}
                >
                  {stats.rugDetected ? "RUG DETECTED" : "SAFE"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: "40px" }}>
        <h2 style={{ marginBottom: "20px" }}>Live Activity Feed</h2>

        <div>
          {events.length === 0 ? (
            <div className="card">
              <p style={{ color: "var(--muted)", textAlign: "center" }}>
                No activity yet. Make a transaction to see events here.
              </p>
            </div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className="event-card"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>{event.message}</span>
                <span className="event-timestamp">{event.timestamp}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
