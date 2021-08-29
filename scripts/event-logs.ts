import { ethers } from "hardhat";

async function main() {
  const stakingTokenFactory = await ethers.getContractFactory('StakingToken')
  const stakingTokenAddress = '0xE594e4F798a7aE94d626c42521C610bE03c73b25'
  let stakingToken = await stakingTokenFactory.attach(stakingTokenAddress)
  console.log(
    `StakingToken was attached to: ${stakingToken.address}`
  );

  // Get Stake events
  let filter = stakingToken.filters.Stake()
  let eventsStake = await stakingToken.queryFilter(filter)

  // Get Unstake events
  filter = stakingToken.filters.Unstake()
  let eventsUnstake = await stakingToken.queryFilter(filter)

  // events denotes all Stake and Unstake events
  let events = eventsStake.concat(eventsUnstake)

  events.sort(function (a, b) {
    if (a.blockNumber < b.blockNumber) return -1;
    if (a.blockNumber > b.blockNumber) return 1;
    return 0;
  });

  const { Parser } = require('json2csv');

  let fields = Object.keys(events[0]);
  let json2csvParser = new Parser({ fields, unwind: 'colors' });

  let csv = json2csvParser.parse(events);

  const fs = require('fs').promises;
  await fs.writeFile('./event-logs.csv', csv);

  console.log('Finished')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
