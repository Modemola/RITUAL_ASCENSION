import { ethers } from "ethers";

const RPC = "https://rpc.ritualfoundation.org/";
const API = "http://localhost:4000";
const PASSPORT_ADDR = "0x32915058a71e96ee39dd32ecbe9959ebf064886b";
const PROGRESS_ADDR = "0x0011e266a9d437e3c65c7b08ac77c6c0b0ee7ebf";
const OPERATOR_KEY = process.env.BACKEND_OPERATOR_PRIVATE_KEY;

const passportAbi = [
  "function mintPassport(uint8 classId)",
  "function tokenOfOwner(address wallet) view returns (uint256)",
  "function passportStage(uint256 tokenId) view returns (uint8)",
  "function hasMinted(address wallet) view returns (bool)"
];
const progressAbi = [
  "function getXP(address wallet) view returns (uint256)"
];

async function main() {
  if (!OPERATOR_KEY) throw new Error("BACKEND_OPERATOR_PRIVATE_KEY not set in env");

  const provider = new ethers.JsonRpcProvider(RPC);
  const operator = new ethers.Wallet(OPERATOR_KEY, provider);
  const testWallet = ethers.Wallet.createRandom().connect(provider);
  console.log("Operator:", operator.address);
  console.log("Fresh test wallet:", testWallet.address);

  // 1. Fund the test wallet with a small amount of gas
  console.log("\n[1] Funding test wallet with 0.002 native token from operator...");
  const fundTx = await operator.sendTransaction({
    to: testWallet.address,
    value: ethers.parseEther("0.002")
  });
  await fundTx.wait();
  console.log("    funded, tx:", fundTx.hash);

  // 2. Real on-chain mint from the test wallet
  console.log("\n[2] Minting a real PassportNFT on-chain for the test wallet...");
  const passportAsTest = new ethers.Contract(PASSPORT_ADDR, passportAbi, testWallet);
  const mintTx = await passportAsTest.mintPassport(1); // class 1 = Builder
  const mintReceipt = await mintTx.wait();
  console.log("    minted, tx:", mintReceipt.hash);

  const tokenId = await passportAsTest.tokenOfOwner(testWallet.address);
  console.log("    on-chain tokenId:", tokenId.toString());
  const stageBefore = await passportAsTest.passportStage(tokenId);
  console.log("    on-chain stage before:", stageBefore.toString());

  const progressReadOnly = new ethers.Contract(PROGRESS_ADDR, progressAbi, provider);
  const xpBefore = await progressReadOnly.getXP(testWallet.address);
  console.log("    on-chain XP before:", xpBefore.toString());

  // 3. Auth with the backend (SIWE-style nonce + signature)
  console.log("\n[3] Authenticating with the backend...");
  const nonceRes = await fetch(`${API}/api/auth/nonce`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet: testWallet.address })
  });
  const nonceBody = await nonceRes.json();
  const signature = await testWallet.signMessage(nonceBody.message);
  const verifyRes = await fetch(`${API}/api/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet: testWallet.address, message: nonceBody.message, signature })
  });
  const { token } = await verifyRes.json();
  console.log("    got session token");

  // 4. Sync the real on-chain passport into the backend's off-chain record
  console.log("\n[4] Syncing on-chain passport state into the backend...");
  const syncRes = await fetch(`${API}/api/passport/sync-chain`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ wallet: testWallet.address })
  });
  const syncBody = await syncRes.json();
  console.log("    sync status:", syncRes.status, "off-chain tokenId:", syncBody.passport?.tokenId);

  // 5. Complete a quest that awards XP and advances stage — this is what fires
  //    the fire-and-forget on-chain awardXP + updateStage calls.
  console.log("\n[5] Completing 'deploy-contract' quest (500 XP, advances to stage 2)...");
  const verifyQuestRes = await fetch(`${API}/api/quests/deploy-contract/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      wallet: testWallet.address,
      proof: "0x" + "ab".repeat(32)
    })
  });
  const verifyQuestBody = await verifyQuestRes.json();
  console.log("    quest verify status:", verifyQuestRes.status);
  console.log("    off-chain result — xp:", verifyQuestBody.progression?.passport?.xp, "stage:", verifyQuestBody.progression?.passport?.stage);

  // 6. The chain write is fire-and-forget — poll on-chain state until it lands.
  console.log("\n[6] Polling on-chain state for the settlement transactions...");
  const passportReadOnly = new ethers.Contract(PASSPORT_ADDR, passportAbi, provider);
  let landed = false;
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const xpNow = await progressReadOnly.getXP(testWallet.address);
    const stageNow = await passportReadOnly.passportStage(tokenId);
    console.log(`    [t+${(i + 1) * 2}s] on-chain XP: ${xpNow.toString()}, on-chain stage: ${stageNow.toString()}`);
    if (xpNow > xpBefore && stageNow > stageBefore) {
      landed = true;
      console.log("\n    Both awardXP and updateStage confirmed on-chain.");
      break;
    }
  }

  if (!landed) {
    console.log("\n    Did not confirm both writes landed within the poll window — see final state above.");
  }
}

main().catch((err) => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});
