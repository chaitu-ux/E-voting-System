import { ethers } from "hardhat";

async function main() {
  const Voting = await ethers.getContractFactory("Voting");
  const voting = await Voting.deploy();

  await voting.waitForDeployment();   // ✅ correct for ethers v6

  const address = await voting.getAddress();

  console.log("Voting contract deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});