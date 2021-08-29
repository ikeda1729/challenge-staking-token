import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Token__factory, Token} from "../typechain";
import { EternalStorage__factory, EternalStorage} from "../typechain";
import { StakingToken__factory, StakingToken} from "../typechain";
import { StakingTokenV2__factory, StakingTokenV2} from "../typechain";

import chai from "chai";
import { solidity } from "ethereum-waffle";

chai.use(solidity);

describe("StakingToken contract", function () {

	let tokenA: Token;
	let tokenB: Token;
	let eternalStorage: EternalStorage;
	let stakingToken: StakingToken;
	let owner: SignerWithAddress;
	let addr1: SignerWithAddress;
	let addr2: SignerWithAddress
	let addrs: SignerWithAddress[];

	const totalSupply = ethers.utils.parseEther("2.0")

	beforeEach(async function () {

		[owner, addr1, addr2, ...addrs] = await ethers.getSigners();

		const tokenFactory = (await ethers.getContractFactory(
			"Token", owner
		)) as Token__factory;
		tokenA = await tokenFactory.deploy(
			'Token A', 'TKNA', totalSupply,
		)
		tokenB = await tokenFactory.deploy(
			'Token B', 'TKNB', 0,
		)

		const eternalStorageFactory = (await ethers.getContractFactory(
			"EternalStorage", owner
		)) as EternalStorage__factory;
		eternalStorage = await eternalStorageFactory.deploy()

		const StakingTokenFactory = (await ethers.getContractFactory(
			"StakingToken", owner
		)) as StakingToken__factory;
		stakingToken = await StakingTokenFactory.deploy(
			tokenA.address, tokenB.address, eternalStorage.address,
		)

		await tokenA.transferOwnership(stakingToken.address)
		await tokenB.transferOwnership(stakingToken.address)
		await eternalStorage.transferOwnership(stakingToken.address)

	});

	describe("Deployment", function () {
		it('Should assign token name, symbol and its owner', async () => {
			expect(await tokenA.name()).to.be.eq('Token A')
			expect(await tokenA.symbol()).to.be.eq('TKNA')
			expect(await tokenB.name()).to.be.eq('Token B')
			expect(await tokenB.symbol()).to.be.eq('TKNB')
			expect(await tokenA.owner()).to.be.eq(stakingToken.address)
			expect(await tokenB.owner()).to.be.eq(stakingToken.address)
			expect(await eternalStorage.owner()).to.be.eq(stakingToken.address)
		})

		it("Should assign the total supply of tokens to the owner", async function () {
			expect(await tokenA.totalSupply()).to.equal(totalSupply);
			expect(await tokenB.totalSupply()).to.equal(0);
		});

		it("Should assign the total supply of stakes", async function () {
			expect(await eternalStorage.totalStakes()).to.equal(0);
		});
	});

	describe("Stake", function () {
		it("Should fail if user does not have enough tokens", async function () {
			await expect(
				stakingToken.connect(addr1).stake(100)
			).to.be.revertedWith("ERC20: burn amount exceeds balance");
		});

		it("Should stake tokens", async function () {
			await tokenA.transfer(addr1.address, 200)
			await stakingToken.connect(addr1).stake(100)
			expect(await tokenA.balanceOf(addr1.address)).to.equal(
				100
			);
			expect(await eternalStorage.getStakes(addr1.address)).to.equal(
				100
			);
			expect(await tokenA.totalSupply()).to.equal(
				totalSupply.sub(100)
			);
			expect(await eternalStorage.totalStakes()).to.equal(
				100
			);
		});

		it("Should add a stakeholder.", async function () {
			await tokenA.transfer(addr1.address, 200)
			await stakingToken.connect(addr1).stake(100)
			expect((await eternalStorage.isStakeholder(addr1.address))[0]).to.equal(true);
		});
	});

	describe("Unstake", function () {
		it("Should fail if user does not have enough stakes", async function () {
			await expect(
				stakingToken.connect(addr1).unstake()
			).to.be.revertedWith("You have no stakes");
		});

		it("Should remove a stakeholder.", async function () {
			await tokenA.transfer(addr1.address, 200)
			await stakingToken.connect(addr1).stake(100)
			await stakingToken.connect(addr1).unstake()

			expect((await eternalStorage.isStakeholder(addr1.address))[0]).to.equal(false);
		});

		it("Should unstake 100 tokens, and user should get unpaid rewards", async function () {
			await tokenA.transfer(addr1.address, 200)
			await stakingToken.connect(addr1).stake(100)
			await stakingToken.connect(addr1).unstake()

			expect(await tokenA.balanceOf(addr1.address)).to.equal(
				200
			);
			expect(await eternalStorage.getStakes(addr1.address)).to.equal(
				0
			);
			expect(await tokenA.totalSupply()).to.equal(
				totalSupply
			);
			expect(await eternalStorage.totalStakes()).to.equal(
				0
			);

			// check reward > 0
			let _reward = await eternalStorage.getRewards(addr1.address)
			expect(_reward).to.gt(
				0
			);
			// check reward is not paid
			expect(await tokenB.balanceOf(addr1.address)).to.equal(
				0
			);

			// again stake and unstake 100 tokens.
			await stakingToken.connect(addr1).stake(100)
			await stakingToken.connect(addr1).unstake()

			// check reward gets double 
			expect(await eternalStorage.getRewards(addr1.address)).to.equal(
				_reward.mul(2)
			);
			// check reward was not paid
			expect(await tokenB.balanceOf(addr1.address)).to.equal(
				0
			);
		});

		it("Should unstake 10**18 tokens, and user should get TokenBs as reward", async function () {
			await tokenA.transfer(addr1.address, ethers.utils.parseEther("1.0"))
			await stakingToken.connect(addr1).stake(ethers.utils.parseEther("1.0"))
			await stakingToken.connect(addr1).unstake()


			// check unpaid reward = 0
			expect(await eternalStorage.getRewards(addr1.address)).to.equal(
				0
			);
			// check reward was paid
			expect(await tokenB.balanceOf(addr1.address)).to.gt(
				0
			);

		});
	});

	describe("StakingToken is updated", function () {
		it("Should fail if non owner resets ownership", async function () {
			await expect(
				stakingToken.connect(addr1).resetOwnership()
			).to.be.revertedWith("Ownable: caller is not the owner");
		});

		it("Should be updated, and stakes and rewards should be storaged.", async function () {
			await tokenA.transfer(addr1.address, 200)

			// Stake and unstake 100 tokens
			await stakingToken.connect(addr1).stake(100)
			await stakingToken.connect(addr1).unstake()

			let _reward = await eternalStorage.getRewards(addr1.address)

			// Again stake 100 tokens
			await stakingToken.connect(addr1).stake(100)

			// Update StakingToken to StakingTokenV2
			const StakingTokenV2Factory = (await ethers.getContractFactory(
				"StakingTokenV2", owner
			)) as StakingTokenV2__factory;
			let stakingTokenV2 = await StakingTokenV2Factory.deploy(
				tokenA.address, tokenB.address, eternalStorage.address,
			)

			await stakingToken.resetOwnership()
			await tokenA.transferOwnership(stakingTokenV2.address)
			await tokenB.transferOwnership(stakingTokenV2.address)
			await eternalStorage.transferOwnership(stakingTokenV2.address)

			// Amount staked in previous version is storaged
			expect(await eternalStorage.getStakes(addr1.address)).to.equal(
				100
			);

			await stakingTokenV2.connect(addr1).unstake()

			// Reward is greater than _reward.mul(2)
			expect(await eternalStorage.getRewards(addr1.address)).to.be.gt(
				_reward.mul(2)
			);
		});
	});
});