import { ethers } from "ethers";
import ShieldFiABI from "../abi/ShieldFi.json";
import MockTokenABI from "../abi/MockToken.json";
import { CONTRACT_ADDRESS, TOKEN_ADDRESS, RPC_URL } from "../config.js";

export const MONAD_TESTNET = {
  chainId: "0x279f",
  rpcUrl: "https://testnet-rpc.monad.xyz",
  name: "Monad Testnet",
  symbol: "MON",
  explorer: "https://testnet.monadexplorer.com",
};

export async function getProvider() {
  if (!window.ethereum) {
    throw new Error("No Ethereum provider found. Please install MetaMask or compatible wallet.");
  }
  return new ethers.BrowserProvider(window.ethereum);
}

export async function getSigner() {
  const provider = await getProvider();
  return provider.getSigner();
}

export async function getShieldFi(signerOrProvider) {
  return new ethers.Contract(CONTRACT_ADDRESS, ShieldFiABI, signerOrProvider);
}

export async function getReadShieldFi() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  return new ethers.Contract(CONTRACT_ADDRESS, ShieldFiABI, provider);
}

export async function getMockToken(signerOrProvider) {
  return new ethers.Contract(TOKEN_ADDRESS, MockTokenABI, signerOrProvider);
}

export async function connectWallet() {
  try {
    if (!window.ethereum) {
      throw new Error("No Ethereum provider found. Please install MetaMask.");
    }

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    const provider = await getProvider();
    const chainId = await window.ethereum.request({
      method: "eth_chainId",
    });

    if (chainId !== MONAD_TESTNET.chainId) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: MONAD_TESTNET.chainId }],
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: MONAD_TESTNET.chainId,
                chainName: MONAD_TESTNET.name,
                rpcUrls: [MONAD_TESTNET.rpcUrl],
                nativeCurrency: {
                  name: "Monad",
                  symbol: MONAD_TESTNET.symbol,
                  decimals: 18,
                },
                blockExplorerUrls: [MONAD_TESTNET.explorer],
              },
            ],
          });
        } else {
          throw switchError;
        }
      }
    }

    const signer = await provider.getSigner();
    return {
      address: accounts[0],
      signer: signer,
    };
  } catch (error) {
    throw new Error(error.message || "Failed to connect wallet");
  }
}

export function formatMON(wei) {
  return ethers.formatEther(wei) + " MON";
}

export function truncateAddress(addr) {
  if (!addr) return "";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

export async function getTokenBalance(tokenAddress, userAddress) {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(tokenAddress, MockTokenABI, provider);
  const balance = await contract.balanceOf(userAddress);
  return balance;
}
