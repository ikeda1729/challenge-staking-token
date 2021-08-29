import { ethers } from "hardhat";

async function main() {
  const tokenFactory = await ethers.getContractFactory('Token')
  const tokenAAddress = '0x970917f99732458c2E0cd725221d0711b65f4761'
  let tokenA = await tokenFactory.attach(tokenAAddress)
  console.log(
    `TokenA was attatched to: ${tokenA.address}`
  );

  const stakingTokenFactory = await ethers.getContractFactory('StakingToken')
  const stakingTokenAddress = '0xE594e4F798a7aE94d626c42521C610bE03c73b25'
  let stakingToken = await stakingTokenFactory.attach(stakingTokenAddress)
  console.log(
    `StakingToken was attatched to: ${stakingToken.address}`
  );

  // Introduce another account related to RINKEBY_PRIVATE_KEY1
  const provider = new ethers.providers.InfuraProvider("rinkeby")
  const privateKey = process.env.RINKEBY_PRIVATE_KEY1 || "";
  const wallet = new ethers.Wallet(privateKey, provider)

  await tokenA.transfer(wallet.address, 10000)
  console.log(`10000 tokens were transferd to: ${wallet.address}`)
  await stakingToken.connect(wallet).stake(10000)
  console.log(`10000 tokens were staked by: ${wallet.address}`)
  await stakingToken.connect(wallet).unstake()
  console.log(`10000 tokens were unstaked by: ${wallet.address}`)

  console.log('Finished')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
