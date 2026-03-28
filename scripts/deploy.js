const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy MockToken
  const MockToken = await ethers.getContractFactory("MockToken");
  const mockToken = await MockToken.deploy();
  await mockToken.waitForDeployment();
  const mockTokenAddress = await mockToken.getAddress();
  console.log("MockToken deployed to:", mockTokenAddress);

  // Deploy ShieldFi
  const ShieldFi = await ethers.getContractFactory("ShieldFi");
  const shieldFi = await ShieldFi.deploy();
  await shieldFi.waitForDeployment();
  const shieldFiAddress = await shieldFi.getAddress();
  console.log("ShieldFi deployed to:", shieldFiAddress);

  // Mint tokens
  const mintTx = await mockToken.mint(
    deployer.address,
    ethers.parseEther("1000000"),
  );
  await mintTx.wait();
  console.log("Minted 1,000,000 SCAM tokens");

  // Register token with initial liquidity simulation
  const registerTx = await shieldFi.registerToken(
    mockTokenAddress,
    ethers.parseEther("100"),
  );
  await registerTx.wait();
  console.log("Token registered with initial liquidity of 100 MON");

  // Write config file
  const configContent = `export const CONTRACT_ADDRESS = "${shieldFiAddress}";
export const TOKEN_ADDRESS = "${mockTokenAddress}";
export const CHAIN_ID = 10143;
export const RPC_URL = "https://testnet-rpc.monad.xyz";
export const EXPLORER_URL = "https://testnet.monadexplorer.com";
`;

  const configPath = path.join(__dirname, "../src/config.js");
  fs.writeFileSync(configPath, configContent);
  console.log("Config file written to src/config.js");

  console.log("\n=== Deployment Summary ===");
  console.log("MockToken:", mockTokenAddress);
  console.log("ShieldFi:", shieldFiAddress);
  console.log("Chain ID: 10143");
  console.log("Network: Monad Testnet");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
