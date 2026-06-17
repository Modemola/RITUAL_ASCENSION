import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { HardhatUserConfig } from "hardhat/config";

const networks: HardhatUserConfig["networks"] = {
  hardhat: {
    type: "edr-simulated"
  }
};

if (process.env.RITUAL_RPC_URL) {
  networks.ritualTestnet = {
    type: "http",
    url: process.env.RITUAL_RPC_URL,
    chainId: Number(process.env.RITUAL_CHAIN_ID ?? 0),
    accounts: process.env.BACKEND_OPERATOR_PRIVATE_KEY ? [process.env.BACKEND_OPERATOR_PRIVATE_KEY] : []
  };
}

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxViemPlugin],
  paths: {
    sources: "./src",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  solidity: {
    version: "0.8.28",
    settings: {
      evmVersion: "cancun",
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks
};

export default config;
