import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🚀 Starting deployment of Voting contract...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📦 Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  // ── Deploy contract ──
  console.log("⏳ Deploying Voting contract...");
  const Voting = await ethers.getContractFactory("Voting");
  const voting = await Voting.deploy();
  await voting.waitForDeployment();

  const contractAddress = await voting.getAddress();
  console.log("✅ Voting contract deployed at:", contractAddress);

  const deployTx = voting.deploymentTransaction();
  console.log("📋 Transaction hash:", deployTx?.hash);

  // ✅ FIX 1: Create election with a long time window immediately after deploy
  // This prevents "Election has not started yet" and "Election has ended" errors
  console.log("\n⏳ Creating election on blockchain...");
  const now = Math.floor(Date.now() / 1000);
  const oneYearFromNow = now + 365 * 24 * 60 * 60; // 1 year window

  const createTx = await voting.createElection(
    "University Student Election 2024",
    now,           // startTime = now
    oneYearFromNow // endTime = 1 year from now
  );
  await createTx.wait();
  console.log("✅ Election created with 1-year window");

  // ✅ FIX 2: Open the election immediately after deploy
  // Previously deploy.ts never called toggleElection(true)
  // so every redeploy left election CLOSED → all voter ops failed
  console.log("⏳ Opening election on blockchain...");
  const toggleTx = await voting.toggleElection(true);
  await toggleTx.wait();
  console.log("✅ Election is now OPEN on blockchain");

  // ── Auto-update backend .env ──
  const envPath = path.join(__dirname, "../backend/.env");

  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, "utf8");

    if (envContent.includes("CONTRACT_ADDRESS=")) {
      envContent = envContent.replace(
        /CONTRACT_ADDRESS=.*/,
        `CONTRACT_ADDRESS=${contractAddress}`
      );
    } else {
      envContent += `\nCONTRACT_ADDRESS=${contractAddress}`;
    }

    fs.writeFileSync(envPath, envContent);
    console.log("\n✅ backend/.env updated with new CONTRACT_ADDRESS");
  } else {
    console.log("\n⚠️  backend/.env not found — update manually:");
    console.log(`   CONTRACT_ADDRESS=${contractAddress}`);
  }

  // ── Summary ──
  console.log("\n════════════════════════════════════════");
  console.log("         DEPLOYMENT SUMMARY");
  console.log("════════════════════════════════════════");
  console.log("Contract Address :", contractAddress);
  console.log("Deployer         :", deployer.address);
  console.log("Election Status  : OPEN ✅");
  console.log("Election Window  : 1 year from now");
  console.log("Network          :", (await ethers.provider.getNetwork()).name);
  console.log("════════════════════════════════════════\n");

  console.log("📌 Next steps:");
  console.log("   1. Restart backend:   cd backend && npm start");
  console.log("   2. Start frontend:    cd frontend && npm start");
  console.log("   3. Re-approve any existing students in Admin Dashboard");
  console.log("      (so their DIDs get registered on the fresh blockchain)\n");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});