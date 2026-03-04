import "@nomicfoundation/hardhat-toolbox";
import { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  networks: {
    // Local Hardhat network (default)
    hardhat: {
      chainId: 31337,
    },

    // Local node — used by your backend (http://127.0.0.1:8545)
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
  },

  // Generated TypeScript types go here
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },

  // Artifact output — your backend reads from here
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;