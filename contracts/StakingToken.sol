// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "hardhat/console.sol";

import "./Token.sol";
import "./EternalStorage.sol";

contract StakingToken is Ownable {
    using SafeMath for uint256;

    uint256 private constant basis = 10000000000000000000000000;
    uint256 private constant power_basis = 10000000000;
    uint256 private constant mint_per_block_and_asset = 120000000000000;

    Token private tokenA;
    Token private tokenB;
    EternalStorage private eternalStorage;

    event Stake(address indexed user, uint256 tokenAmount, uint256 initialPrice);
    event Unstake(address indexed user, uint256 tokenAmount, uint256 price, uint256 rewardPaid, uint256 rewardUnpaid);

    constructor(
        Token _tokenA,
        Token _tokenB,
        EternalStorage _eternalStorage
    ) {
        tokenA = _tokenA;
        tokenB = _tokenB;
        eternalStorage = _eternalStorage;
    }

    function resetOwnership() public onlyOwner {
        tokenA.transferOwnership(msg.sender);
        tokenB.transferOwnership(msg.sender);
        eternalStorage.transferOwnership(msg.sender);
    }

    function stake(uint256 _stake) public {
        // stake tokens
        tokenA.burn(msg.sender, _stake);
        uint256 _stake_current = eternalStorage.getStakes(msg.sender);
        if (_stake_current == 0) eternalStorage.addStakeholder(msg.sender);
        eternalStorage.setStakes(msg.sender, _stake_current.add(_stake));

        uint256 _price = updatePrice();
        eternalStorage.setInitialPrices(msg.sender, _price);

        // update mintPerBlock
        uint256 _mint = calcMintPerBlockAndAsset();
        eternalStorage.setMintPerBlockAndAsset(_mint);

        emit Stake(msg.sender, _stake, _price);
    }

    function unstake() public {
        uint256 _stake = eternalStorage.getStakes(msg.sender);
        require(_stake > 0, "You have no stakes");
        eternalStorage.setStakes(msg.sender, uint256(0));
        eternalStorage.removeStakeholder(msg.sender);
        tokenA.mint(msg.sender, _stake);

        uint256 _price = updatePrice();

        // mint rewards
        uint256 _initialPrice = eternalStorage.getInitialPrices(msg.sender);
        uint256 _reward = (_price.sub(_initialPrice)).mul(_stake);
        uint256 _rewardPaid = _reward.div(basis).mul(basis);
        uint256 _currentReward = eternalStorage.getRewards(msg.sender);
        uint256 _rewardUnpaid = _currentReward.add(_reward.sub(_rewardPaid));

        tokenB.mint(msg.sender, _rewardPaid);
        eternalStorage.setRewards(msg.sender, _rewardUnpaid);

        // update mintPerBlock
        uint256 _mint = calcMintPerBlockAndAsset();
        eternalStorage.setMintPerBlockAndAsset(_mint);

        emit Unstake(msg.sender, _stake, _price, _rewardPaid, _rewardUnpaid);
    }

    function updatePrice() internal returns (uint256 price) {
        uint256 _duration = block.number.sub(
            eternalStorage.getPriceUpdatedAt()
        );
        uint256 _price = eternalStorage.getPrice().add(
            _duration.mul(eternalStorage.getMintPerBlockAndAsset())
        );
        eternalStorage.setPrice(_price);
        eternalStorage.setPriceUpdatedAt(block.number);
        return _price;
    }

    function calcMintPerBlockAndAsset()
        public
        view
        returns (uint256)
    {
        uint256 t = tokenA.totalSupply();
        uint256 s = eternalStorage.totalStakes();
        t = t.add(s);
        s = (s.mul(basis)).div(t);
        uint256 max = (basis.sub(s)).mul(mint_per_block_and_asset);
        uint256 _d = basis.sub(s);
        uint256 _p = (
            (power_basis.mul(12)).sub(s.div((basis.div((power_basis.mul(10))))))
        ).div(2);
        uint256 p = _p.div(power_basis);
        uint256 rp = p.add(1);
        uint256 f = _p.sub(p.mul(power_basis));
        uint256 d1 = _d;
        uint256 d2 = _d;
        for (uint256 i = 0; i < p; i++) {
            d1 = (d1.mul(_d)).div(basis);
        }
        for (uint256 i = 0; i < rp; i++) {
            d2 = (d2.mul(_d)).div(basis);
        }
        uint256 g = ((d1.sub(d2)).mul(f)).div(power_basis);
        uint256 d = d1.sub(g);
        uint256 mint = max.mul(d);
        mint = mint.div(basis).div(basis);
        return mint;
    }
}
