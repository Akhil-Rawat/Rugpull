import { useState, useEffect } from "react";
import {
  getShieldFi,
  getReadShieldFi,
  formatMON,
} from "../utils/contract";
import { EXPLORER_URL } from "../config";
import { ethers } from "ethers";

export default function MyClaims({ wallet, onConnect, isConnecting }) {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);
  const [claimStatus, setClaimStatus] = useState(null);
  const [claimTxHash, setClaimTxHash] = useState(null);
  const [claimAmount, setClaimAmount] = useState(null);
  const [claimTime, setClaimTime] = useState(null);

  useEffect(() => {
    if (wallet) {
      fetchPolicies();
      const interval = setInterval(fetchPolicies, 10000);
      return () => clearInterval(interval);
    }
  }, [wallet]);

  const fetchPolicies = async () => {
    try {
      const contract = await getReadShieldFi();
      const policyIds = await contract.getUserPolicies(wallet.address);

      const policiesData = await Promise.all(
        policyIds.map(async (id) => {
          const policy = await contract.getPolicy(id);
          const tokenRisk = await contract.getTokenRisk(policy.tokenAddress);

          const now = Math.floor(Date.now() / 1000);
          let statusBadge = "Active";
          let statusColor = "green";

          if (!policy.active && policy.claimed) {
            statusBadge = "Paid Out";
            statusColor = "gray";
          } else if (now > policy.expiryTime) {
            statusBadge = "Expired";
            statusColor = "gray";
          } else if (tokenRisk.rugDetected && !policy.claimed) {
            statusBadge = "CLAIM NOW";
            statusColor = "red";
          }

          return {
            id: id.toString(),
            tokenAddress: policy.tokenAddress,
            insuredAmount: policy.insuredAmount,
            premium: policy.premium,
            startTime: policy.startTime,
            expiryTime: policy.expiryTime,
            active: policy.active,
            claimed: policy.claimed,
            rugDetected: tokenRisk.rugDetected,
            statusBadge,
            statusColor,
          };
        })
      );

      setPolicies(policiesData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching policies:", error);
      setLoading(false);
    }
  };

  const handleClaimPayout = async (policyId, insuredAmount) => {
    setClaiming(policyId);
    setClaimStatus(null);
    setClaimTxHash(null);
    setClaimAmount(null);
    setClaimTime(null);

    try {
      const contract = await getShieldFi(wallet.signer);
      const startTime = Date.now();

      setClaimStatus({
        type: "pending",
        message: "Processing payout on Monad...",
      });

      const tx = await contract.claimPayout(policyId);
      const receipt = await tx.wait();

      const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);

      setClaimTxHash(tx.hash);
      setClaimAmount(formatMON(insuredAmount));
      setClaimTime(elapsedTime);
      setClaimStatus({
        type: "success",
        message: `✅ Payout received! ${formatMON(insuredAmount)} sent to your wallet`,
      });

      await fetchPolicies();
    } catch (error) {
      console.error("Error claiming payout:", error);
      setClaimStatus({
        type: "error",
        message: error.message || "Failed to claim payout",
      });
    } finally {
      setClaiming(null);
    }
  };

  if (!wallet) {
    return (
      <div>
        <div className="hero">
          <h1>My Claims</h1>
          <p>View and manage your insurance policies</p>
        </div>

        <div className="card" style={{ maxWidth: "500px", margin: "40px auto" }}>
          <p style={{ marginBottom: "20px", color: "var(--muted)" }}>
            Please connect your wallet to view your claims.
          </p>
          <button
            className="btn"
            onClick={onConnect}
            disabled={isConnecting}
            style={{ width: "100%" }}
          >
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="hero">
        <p>Loading policies...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="hero">
        <h1>My Claims</h1>
        <p>Manage your insurance policies and claim payouts</p>
      </div>

      {claimStatus && (
        <div className={`status-${claimStatus.type}`} style={{ marginBottom: "20px" }}>
          {claimStatus.type === "pending" && <span className="spinner"></span>}
          {claimStatus.message}

          {claimTxHash && (
            <div style={{ fontSize: "12px", marginTop: "8px" }}>
              <a
                href={`${EXPLORER_URL}/tx/${claimTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: claimStatus.type === "success" ? "var(--green)" : "var(--red)" }}
              >
                View on Explorer →
              </a>
            </div>
          )}

          {claimTime && (
            <div
              style={{
                fontSize: "12px",
                marginTop: "8px",
                color: "var(--muted)",
              }}
            >
              Payout completed in {claimTime}s
            </div>
          )}
        </div>
      )}

      {policies.length === 0 ? (
        <div className="card">
          <p style={{ color: "var(--muted)", textAlign: "center" }}>
            No policies yet. Buy coverage to get started.
          </p>
        </div>
      ) : (
        <div className="card" style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Policy ID</th>
                <th>Token</th>
                <th>Insured Amount</th>
                <th>Premium</th>
                <th>Status</th>
                <th>Expiry</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((policy) => {
                const expiryDate = new Date(
                  Number(policy.expiryTime) * 1000
                ).toLocaleDateString();

                return (
                  <tr key={policy.id}>
                    <td>{policy.id.substring(0, 8)}...</td>
                    <td>{policy.tokenAddress.substring(0, 8)}...</td>
                    <td>{formatMON(policy.insuredAmount)}</td>
                    <td>{formatMON(policy.premium)}</td>
                    <td>
                      <span
                        className={`badge-${policy.statusColor}`}
                        style={{
                          padding: "4px 8px",
                          display: "inline-block",
                        }}
                      >
                        {policy.statusBadge}
                      </span>
                    </td>
                    <td>{expiryDate}</td>
                    <td>
                      {policy.rugDetected && !policy.claimed && (
                        <button
                          className="btn-red"
                          onClick={() =>
                            handleClaimPayout(policy.id, policy.insuredAmount)
                          }
                          disabled={claiming === policy.id}
                          style={{
                            padding: "6px 12px",
                            fontSize: "12px",
                          }}
                        >
                          {claiming === policy.id ? "Claiming..." : "Claim"}
                        </button>
                      )}
                      {!(policy.rugDetected && !policy.claimed) && (
                        <span style={{ color: "var(--muted)", fontSize: "12px" }}>
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
