import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { EternalStorage__factory, EternalStorage } from "../typechain";

describe("EternalStorage contract", function () {

	let eternalStorage: EternalStorage;
	let owner: SignerWithAddress;
	let addr1: SignerWithAddress;
	let addr2: SignerWithAddress
	let addrs: SignerWithAddress[];

	beforeEach(async function () {

		[owner, addr1, addr2, ...addrs] = await ethers.getSigners();


		const eternalStorageFactory = (await ethers.getContractFactory(
			"EternalStorage", owner
		)) as EternalStorage__factory;
		eternalStorage = await eternalStorageFactory.deploy()

	});

	describe("Get, set functions", function () {
		it("Should set staking variables", async function () {
			await eternalStorage.setStakes(addr1.address, 100)
			expect(await eternalStorage.getStakes(addr1.address)).to.equal(100)

			await eternalStorage.addStakeholder(addr1.address)
			expect((await eternalStorage.getStakeholders())[0]).to.equal(addr1.address)
			expect(await eternalStorage.totalStakes()).to.equal(100)

			await eternalStorage.removeStakeholder(addr1.address)
			expect((await eternalStorage.getStakeholders()).length).to.equal(0)

			await eternalStorage.setPrice(200)
			expect(await eternalStorage.getPrice()).to.equal(200)

			await eternalStorage.setPriceUpdatedAt(300)
			expect(await eternalStorage.getPriceUpdatedAt()).to.equal(300)

			await eternalStorage.setInitialPrices(addr1.address, 400)
			expect(await eternalStorage.getInitialPrices(addr1.address)).to.equal(400)

			await eternalStorage.setRewards(addr1.address, 500)
			expect(await eternalStorage.getRewards(addr1.address)).to.equal(500)

			await eternalStorage.setMintPerBlockAndAsset(600)
			expect(await eternalStorage.getMintPerBlockAndAsset()).to.equal(600)
		});

		it("Should fail if sender is not owner", async function () {
			await expect(
				eternalStorage.connect(addr1).setStakes(addr1.address, 100)
			).to.be.revertedWith("Ownable: caller is not the owner");
			await expect(
				eternalStorage.connect(addr1).addStakeholder(addr1.address)
			).to.be.revertedWith("Ownable: caller is not the owner");
			await expect(
				eternalStorage.connect(addr1).removeStakeholder(addr1.address)
			).to.be.revertedWith("Ownable: caller is not the owner");
			await expect(
				eternalStorage.connect(addr1).setPrice(100)
			).to.be.revertedWith("Ownable: caller is not the owner");
			await expect(
				eternalStorage.connect(addr1).setPriceUpdatedAt(100)
			).to.be.revertedWith("Ownable: caller is not the owner");
			await expect(
				eternalStorage.connect(addr1).setInitialPrices(addr1.address, 100)
			).to.be.revertedWith("Ownable: caller is not the owner");
			await expect(
				eternalStorage.connect(addr1).setRewards(addr1.address, 100)
			).to.be.revertedWith("Ownable: caller is not the owner");
			await expect(
				eternalStorage.connect(addr1).setMintPerBlockAndAsset(100)
			).to.be.revertedWith("Ownable: caller is not the owner");
		});
	});
});