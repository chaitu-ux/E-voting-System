import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🚀 Starting deployment of Voting contract...\n");

  // Get deployer wallet
  const [deployer] = await ethers.getSigners();
  console.log("📦 Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  // Deploy contract
  console.log("⏳ Deploying Voting contract...");
  const Voting = await ethers.getContractFactory("Voting");
  const voting = await Voting.deploy();
  await voting.waitForDeployment();

  const contractAddress = await voting.getAddress();
  console.log("✅ Voting contract deployed at:", contractAddress);

  // Get deployment transaction details
  const deployTx = voting.deploymentTransaction();
  console.log("📋 Transaction hash:", deployTx?.hash);
  console.log("🔷 Block number:", deployTx?.blockNumber ?? "pending");

  // ── Auto-update backend .env with new contract address ──
  const envPath = path.join(__dirname, "../backend/.env");

  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, "utf8");

    if (envContent.includes("CONTRACT_ADDRESS=")) {
      // Replace existing CONTRACT_ADDRESS
      envContent = envContent.replace(
        /CONTRACT_ADDRESS=.*/,
        `CONTRACT_ADDRESS=${contractAddress}`
      );
    } else {
      // Add it if missing
      envContent += `\nCONTRACT_ADDRESS=${contractAddress}`;
    }

    fs.writeFileSync(envPath, envContent);
    console.log("\n✅ backend/.env updated with new CONTRACT_ADDRESS");
  } else {
    console.log("\n⚠️  backend/.env not found — update CONTRACT_ADDRESS manually:");
    console.log(`   CONTRACT_ADDRESS=${contractAddress}`);
  }

  // ── Print summary ──
  console.log("\n════════════════════════════════════════");
  console.log("         DEPLOYMENT SUMMARY");
  console.log("════════════════════════════════════════");
  console.log("Contract Address :", contractAddress);
  console.log("Deployer         :", deployer.address);
  console.log("Network          :", (await ethers.provider.getNetwork()).name);
  console.log("════════════════════════════════════════\n");

  console.log("📌 Next steps:");
  console.log("   1. Start Hardhat node:  npx hardhat node");
  console.log("   2. Start backend:       cd backend && npm start");
  console.log("   3. Start frontend:      cd frontend && npm start");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});