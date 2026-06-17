import { network } from "hardhat";

const { viem } = await network.create();
const [deployer] = await viem.getWalletClients();
const backendOperator = process.env.BACKEND_OPERATOR_ADDRESS ?? deployer.account.address;

const passport = await viem.deployContract("PassportNFT", [backendOperator]);
const progress = await viem.deployContract("ProgressManager", [backendOperator]);

console.log("PassportNFT:", passport.address);
console.log("ProgressManager:", progress.address);
