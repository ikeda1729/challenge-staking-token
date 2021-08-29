import { ethers } from "hardhat";

async function main() {
  const tokenFactory = await ethers.getContractFactory('Token')

  let tokenA = await tokenFactory.deploy('Token A', 'TKNA', 1000000)
  await tokenA.deployed();
  console.log(
      `TokenA was deployed to: ${tokenA.address}`
  );

  let tokenB = await tokenFactory.deploy('Token B', 'TKNB', 0)
  await tokenB.deployed();
  console.log(
      `TokenB was deployed to: ${tokenB.address}`
  );

  const eternalStorageFactory = await ethers.getContractFactory('EternalStorage')
  let eternalStorage = await eternalStorageFactory.deploy()
  await eternalStorage.deployed();
  console.log(
      `EternalStorage was deployed to: ${eternalStorage.address}`
  );

  const stakingTokenFactory = await ethers.getContractFactory('StakingToken')
  let stakingToken = await stakingTokenFactory.deploy(tokenA.address, tokenB.address, eternalStorage.address)
  await stakingToken.deployed();
  console.log(
      `StakingToken was deployed to: ${stakingToken.address}`
  );

  await tokenA.transferOwnership(stakingToken.address)
  await tokenB.transferOwnership(stakingToken.address)
  await eternalStorage.transferOwnership(stakingToken.address)

  console.log('Ownership was transfered to StakingToken')
  console.log('Finished!')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
