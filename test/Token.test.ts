import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Token__factory, Token } from "../typechain";

describe("Token contract", function () {

	let token: Token;
	let owner: SignerWithAddress;
	let addr1: SignerWithAddress;
	let addr2: SignerWithAddress
	let addrs: SignerWithAddress[];

	beforeEach(async function () {

		[owner, addr1, addr2, ...addrs] = await ethers.getSigners();

		const tokenFactory = (await ethers.getContractFactory(
			"Token", owner
		)) as Token__factory;
		const totalSupply = (10 ** 9).toString()
		token = await tokenFactory.deploy(
			'My Token', 'MTKN', ethers.utils.parseEther(totalSupply),
		)

	});

	describe("Deployment", function () {

		it('Should assign token name and symbol', async () => {
			expect(await token.name()).to.be.eq('My Token')
			expect(await token.symbol()).to.be.eq('MTKN')
		})

		it("Should assign the total supply of tokens to the owner", async function () {
			const ownerBalance = await token.balanceOf(owner.address);
			expect(await token.totalSupply()).to.equal(ownerBalance);
		});
	});

	describe("Transactions", function () {
		it("Should transfer tokens between accounts", async function () {
			// Transfer 50 tokens from owner to addr1
			await token.transfer(addr1.address, 50);
			const addr1Balance = await token.balanceOf(addr1.address);
			expect(addr1Balance).to.equal(50);

			// Transfer 50 tokens from addr1 to addr2
			// We use .connect(signer) to send a transaction from another account
			await token.connect(addr1).transfer(addr2.address, 50);
			const addr2Balance = await token.balanceOf(addr2.address);
			expect(addr2Balance).to.equal(50);
		});

		it("Should fail if sender doesn’t have enough tokens", async function () {
			const initialOwnerBalance = await token.balanceOf(owner.address);

			// Try to send 1 token from addr1 (0 tokens) to owner (1000 tokens).
			// `require` will evaluate false and revert the transaction.
			await expect(
				token.connect(addr1).transfer(owner.address, 1)
			).to.be.revertedWith("ERC20: transfer amount exceeds balance");

			// Owner balance shouldn't have changed.
			expect(await token.balanceOf(owner.address)).to.equal(
				initialOwnerBalance
			);
		});

		it("Should update balances after transfers", async function () {
			const initialOwnerBalance = await token.balanceOf(owner.address);

			// Transfer 100 tokens from owner to addr1.
			await token.transfer(addr1.address, 100);

			// Transfer another 50 tokens from owner to addr2.
			await token.transfer(addr2.address, 50);

			// Check balances.
			const finalOwnerBalance = await token.balanceOf(owner.address);
			expect(finalOwnerBalance).to.equal(initialOwnerBalance.sub(150));

			const addr1Balance = await token.balanceOf(addr1.address);
			expect(addr1Balance).to.equal(100);
			const addr2Balance = await token.balanceOf(addr2.address);
			expect(addr2Balance).to.equal(50);
		});
	});

	describe("Mint", function () {
		it("Should mint tokens", async function () {
			const initialOwnerBalance = await token.balanceOf(owner.address);

			// Mint 50 tokens from owner to owner
			await token.mint(owner.address, 50);

			// Check balances.
			const finalOwnerBalance = await token.balanceOf(owner.address);
			expect(finalOwnerBalance).to.equal(initialOwnerBalance.add(50));
		});

		it("Should fail if non owner mints tokens", async function () {
			const initialBalance = await token.balanceOf(addr1.address);

			await expect(
				token.connect(addr1).mint(addr1.address, 50)
			).to.be.revertedWith("Ownable: caller is not the owner");

			// addr1 balance shouldn't have changed.
			expect(await token.balanceOf(addr1.address)).to.equal(
				initialBalance
			);
		});
	});

	describe("Burn", function () {
		it("Should burn tokens", async function () {
			const initialOwnerBalance = await token.balanceOf(owner.address);

			// Burn 50 tokens from owner to owner
			await token.burn(owner.address, 50);

			// Check balances.
			const finalOwnerBalance = await token.balanceOf(owner.address);
			expect(finalOwnerBalance).to.equal(initialOwnerBalance.sub(50));
		});

		it("Should fail if non owner burns tokens", async function () {
			const initialBalance = await token.balanceOf(addr1.address);

			await expect(
				token.connect(addr1).burn(addr1.address, 50)
			).to.be.revertedWith("Ownable: caller is not the owner");

			// addr1 balance shouldn't have changed.
			expect(await token.balanceOf(addr1.address)).to.equal(
				initialBalance
			);
		});
	});
});