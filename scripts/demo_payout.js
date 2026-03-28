const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("\n🚀 DEMO: Payout Calculation");
  console.log("============================");
  console.log("Deployer:", deployer.address);

  // ===== STEP 1: Deploy Contracts =====
  console.log("\n📦 Step 1: Deploy Contracts");
  const MockToken = await ethers.getContractFactory("MockToken");
  const mockToken = await MockToken.deploy();
  await mockToken.waitForDeployment();
  const tokenAddr = await mockToken.getAddress();
  console.log("✅ MockToken deployed:", tokenAddr);

  const ShieldFi = await ethers.getContractFactory("ShieldFi");
  const shieldFi = await ShieldFi.deploy();
  await shieldFi.waitForDeployment();
  const contractAddr = await shieldFi.getAddress();
  console.log("✅ ShieldFi deployed:", contractAddr);

  // ===== STEP 2: Set Demo Threshold =====
  console.log("\n⚙️ Step 2: Configure Demo");
  const setThresholdTx = await shieldFi.setPayoutThreshold(2000); // 20%
  await setThresholdTx.wait();
  console.log("✅ Payout threshold set to 20% (2000 bps)");

  // ===== STEP 3: Register Token =====
  console.log("\n📋 Step 3: Register Token");
  const initialLiquidity = ethers.parseEther("100");
  const registerTx = await shieldFi.registerToken(tokenAddr, initialLiquidity);
  await registerTx.wait();
  console.log("✅ Token registered with 100 MON initial liquidity");

  // ===== STEP 4: Mint Tokens =====
  console.log("\n💰 Step 4: Mint Test Tokens");
  const mintTx = await mockToken.mint(
    deployer.address,
    ethers.parseEther("1000000"),
  );
  await mintTx.wait();
  console.log("✅ Minted 1,000,000 SCAM tokens");

  // ===== STEP 5: Buy Coverage =====
  console.log("\n🛡️  Step 5: Buy Coverage");
  const insuredAmount = ethers.parseEther("2"); // 2 MON
  const premium = await shieldFi.getPremiumForAmount(insuredAmount);
  console.log(`   Insured Amount: 2 MON`);
  console.log(`   Premium (10%): ${ethers.formatEther(premium)} MON`);

  const buyCoverageTx = await shieldFi.buyCoverage(tokenAddr, insuredAmount, {
    value: premium,
  });
  const buyReceipt = await buyCoverageTx.wait();
  console.log("✅ Coverage purchased");
  console.log(`   TX Hash: ${buyCoverageTx.hash}`);

  // Check premium pool
  let premiumPool = await shieldFi.totalPremiumPool();
  console.log(`   Premium Pool: ${ethers.formatEther(premiumPool)} MON`);

  // ===== STEP 6: Simulate 20% Drop =====
  console.log("\n📉 Step 6: Simulate 20% Liquidity Drop");
  const newLiquidity = ethers.parseEther("80"); // 100 → 80 = 20% drop
  const updateTx = await shieldFi.updateLiquidity(tokenAddr, newLiquidity);
  await updateTx.wait();
  console.log(`   Old Liquidity: 100 MON`);
  console.log(`   New Liquidity: 80 MON`);
  console.log(`   Drop: 20%`);
  console.log(`✅ TX Hash: ${updateTx.hash}`);

  // Verify rug detection
  const tokenRisk = await shieldFi.getTokenRisk(tokenAddr);
  console.log(`   Rug Detected: ${tokenRisk.rugDetected}`);
  console.log(
    `   Last Drop BPS: ${tokenRisk.lastDropBps} (${
      tokenRisk.lastDropBps / 100
    }%)`,
  );

  // ===== STEP 7: Calculate Expected Payout =====
  console.log("\n💸 Step 7: Calculate Payout");
  const dropBps = tokenRisk.lastDropBps;
  const payoutBps = 10000 - dropBps; // 10000 - 2000 = 8000
  const expectedPayout = (insuredAmount * BigInt(payoutBps)) / BigInt(10000);
  console.log(`   Insured: 2 MON`);
  console.log(`   Drop: 20% (2000 bps)`);
  console.log(`   Payout Formula: 2 * (10000 - 2000) / 10000`);
  console.log(`   Payout Formula: 2 * 8000 / 10000`);
  console.log(`   Expected Payout: ${ethers.formatEther(expectedPayout)} MON`);

  // ===== STEP 8: Claim Payout =====
  console.log("\n✅ Step 8: Claim Payout");
  const policyId = 0;
  const policy = await shieldFi.getPolicy(policyId);
  console.log(`   Policy ID: ${policyId}`);
  console.log(`   Policy Holder: ${policy.holder}`);
  console.log(`   Policy Active: ${policy.active}`);
  console.log(`   Already Claimed: ${policy.claimed}`);

  const beforeBalance = await ethers.provider.getBalance(deployer.address);
  const claimTx = await shieldFi.claimPayout(policyId);
  const claimReceipt = await claimTx.wait();
  const afterBalance = await ethers.provider.getBalance(deployer.address);

  console.log(`✅ Payout claimed!`);
  console.log(`   TX Hash: ${claimTx.hash}`);
  console.log(`   Gas Used: ${claimReceipt.gasUsed.toString()}`);

  // ===== STEP 9: Verify Results =====
  console.log("\n📊 Step 9: Verify Results");
  const finalPolicy = await shieldFi.getPolicy(policyId);
  const finalPremiumPool = await shieldFi.totalPremiumPool();
  console.log(`   Policy Claimed: ${finalPolicy.claimed}`);
  console.log(`   Policy Active: ${finalPolicy.active}`);
  console.log(
    `   Premium Pool After: ${ethers.formatEther(finalPremiumPool)} MON`,
  );

  // Calculate actual payout received (rough estimate)
  const gasCost = claimReceipt.gasUsed * claimReceipt.gasPrice;
  const actualPayout = expectedPayout - gasCost;
  console.log(`   Expected Payout: ${ethers.formatEther(expectedPayout)} MON`);
  console.log(
    `   Actual Received (approx): ${ethers.formatEther(actualPayout)} MON`,
  );

  console.log("\n✨ DEMO COMPLETE!");
  console.log("===================");
  console.log("Summary:");
  console.log(`- Insured 2 MON with 0.2 MON premium`);
  console.log(`- Liquidity dropped 20%`);
  console.log(`- Received ${ethers.formatEther(expectedPayout)} MON payout`);
  console.log(
    `- Premium Pool now has ${ethers.formatEther(finalPremiumPool)} MON`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
