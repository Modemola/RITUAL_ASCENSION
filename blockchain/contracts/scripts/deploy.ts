import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const backendOperator = process.env.BACKEND_OPERATOR_ADDRESS ?? deployer.address;

  const Passport = await ethers.getContractFactory("PassportNFT");
  const passport = await Passport.deploy(backendOperator);
  await passport.waitForDeployment();

  const Progress = await ethers.getContractFactory("ProgressManager");
  const progress = await Progress.deploy(backendOperator);
  await progress.waitForDeployment();

  console.log("PassportNFT:", await passport.getAddress());
  console.log("ProgressManager:", await progress.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
