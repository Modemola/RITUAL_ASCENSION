import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
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
  networks: {
    hardhat: {},
    ritualTestnet: {
      url: process.env.RITUAL_RPC_URL ?? "",
      chainId: Number(process.env.RITUAL_CHAIN_ID ?? 0),
      accounts: process.env.BACKEND_OPERATOR_PRIVATE_KEY ? [process.env.BACKEND_OPERATOR_PRIVATE_KEY] : []
    }
  }
};

export default config;
