// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract EternalStorage is Ownable {
    using SafeMath for uint256;

    /// @notice mappings used to store all kinds on data into the contract
    mapping(bytes32 => uint256) uintStorage;
    mapping(bytes32 => string) stringStorage;
    mapping(bytes32 => address) addressStorage;
    mapping(bytes32 => bytes) bytesStorage;
    mapping(bytes32 => bool) boolStorage;
    mapping(bytes32 => int256) intStorage;
    mapping(bytes32 => bytes32) bytes32Storage;

    /// @notice mappings used to store arrays of different data types
    mapping(bytes32 => bytes32[]) bytes32ArrayStorage;
    mapping(bytes32 => uint256[]) uintArrayStorage;
    mapping(bytes32 => address[]) addressArrayStorage;
    mapping(bytes32 => string[]) stringArrayStorage;

    uint256 private constant basis = 10000000000000000000000000;
    uint256 private constant power_basis = 10000000000;
    uint256 private constant mint_per_block_and_asset = 120000000000000;

    constructor(
    ) {
        setPrice(basis);
        setPriceUpdatedAt(block.number);
        setMintPerBlockAndAsset(mint_per_block_and_asset);
    }

    function setStakes(address _address, uint256 _stake) public onlyOwner {
        set(keccak256(abi.encodePacked("stakes", _address)), _stake);
    }

    function getStakes(address _address) public view returns (uint256) {
        return getUintValue(keccak256(abi.encodePacked("stakes", _address)));
    }

    function getStakeholders() public view returns (address[] memory) {
        return getArrayAddress(keccak256(abi.encodePacked("stakeholders")));
    }

    function setPrice(uint256 _price) public onlyOwner {
        set(keccak256(abi.encodePacked("price")), _price);
    }

    function getPrice() public view returns (uint256) {
        return getUintValue(keccak256(abi.encodePacked("price")));
    }

    function setPriceUpdatedAt(uint256 _blockNumber) public onlyOwner {
        set(keccak256(abi.encodePacked("priceUpdatedAt")), _blockNumber);
    }

    function getPriceUpdatedAt() public view returns (uint256) {
        return getUintValue(keccak256(abi.encodePacked("priceUpdatedAt")));
    }

    function setInitialPrices(address _address, uint256 _initialPrice)
        public
        onlyOwner
    {
        set(
            keccak256(abi.encodePacked("initialPrices", _address)),
            _initialPrice
        );
    }

    function getInitialPrices(address _address) public view returns (uint256) {
        return
            getUintValue(
                keccak256(abi.encodePacked("initialPrices", _address))
            );
    }

    function setRewards(address _address, uint256 _reward) public onlyOwner {
        set(keccak256(abi.encodePacked("rewards", _address)), _reward);
    }

    function getRewards(address _address) public view returns (uint256) {
        return getUintValue(keccak256(abi.encodePacked("rewards", _address)));
    }

    function setMintPerBlockAndAsset(uint256 _mint) public onlyOwner {
        set(keccak256(abi.encodePacked("mintPerBlockAndAsset")), _mint);
    }

    function getMintPerBlockAndAsset() public view returns (uint256) {
        return
            getUintValue(keccak256(abi.encodePacked("mintPerBlockAndAsset")));
    }

    // ---------- STAKEHOLDERS ----------

    /**
     * @notice A method to check if an address is a stakeholder.
     * @param _address The address to verify.
     * @return bool, uint256 Whether the address is a stakeholder,
     * and if so its position in the stakeholders array.
     */
    function isStakeholder(address _address)
        public
        view
        returns (bool, uint256)
    {
        address[] memory _stakeholders = getStakeholders();
        for (uint256 s = 0; s < _stakeholders.length; s += 1) {
            if (_address == _stakeholders[s]) return (true, s);
        }
        return (false, 0);
    }

    /**
     * @notice A method to add a stakeholder.
     * @param _stakeholder The stakeholder to add.
     */
    function addStakeholder(address _stakeholder) public onlyOwner {
        (bool _isStakeholder, ) = isStakeholder(_stakeholder);
        if (!_isStakeholder) {
            pushArray(keccak256(abi.encodePacked("stakeholders")), _stakeholder);
        }
    }

    /**
     * @notice A method to remove a stakeholder.
     * @param _stakeholder The stakeholder to remove.
     */
    function removeStakeholder(address _stakeholder) public onlyOwner {
        (bool _isStakeholder, uint256 _index) = isStakeholder(_stakeholder);
        if (_isStakeholder) {
            deleteArrayAddress(keccak256(abi.encodePacked("stakeholders")), _index);
        }
    }

    /**
     * @notice A method to the aggregated stakes from all stakeholders.
     * @return uint256 The aggregated stakes from all stakeholders.
     */
    function totalStakes() public view returns (uint256) {
        uint256 _totalStakes = 0;
        address[] memory _stakeholders = getStakeholders();
        for (uint256 s = 0; s < _stakeholders.length; s += 1) {
            _totalStakes = _totalStakes.add(getStakes(_stakeholders[s]));
        }
        return _totalStakes;
    }

    //////////////////
    //// set functions
    //////////////////
    /// @notice Set the key values using the Overloaded `set` functions
    /// Ex- string version = "0.0.1"; replace to
    /// set(keccak256(abi.encodePacked("version"), "0.0.1");
    /// same for the other variables as well some more example listed below
    /// ex1 - address securityTokenAddress = 0x123; replace to
    /// set(keccak256(abi.encodePacked("securityTokenAddress"), 0x123);
    /// ex2 - bytes32 tokenDetails = "I am ST20"; replace to
    /// set(keccak256(abi.encodePacked("tokenDetails"), "I am ST20");
    /// ex3 - mapping(string => address) ownedToken;
    /// set(keccak256(abi.encodePacked("ownedToken", "Chris")), 0x123);
    /// ex4 - mapping(string => uint) tokenIndex;
    /// tokenIndex["TOKEN"] = 1; replace to set(keccak256(abi.encodePacked("tokenIndex", "TOKEN"), 1);
    /// ex5 - mapping(string => SymbolDetails) registeredSymbols; where SymbolDetails is the structure having different type of values as
    /// {uint256 date, string name, address owner} etc.
    /// registeredSymbols["TOKEN"].name = "MyFristToken"; replace to set(keccak256(abi.encodePacked("registeredSymbols_name", "TOKEN"), "MyFirstToken");
    /// More generalized- set(keccak256(abi.encodePacked("registeredSymbols_<struct variable>", "keyname"), "value");
    function set(bytes32 _key, uint256 _value) internal {
        uintStorage[_key] = _value;
    }

    function set(bytes32 _key, address _value) internal {
        addressStorage[_key] = _value;
    }

    function set(bytes32 _key, bool _value) internal {
        boolStorage[_key] = _value;
    }

    function set(bytes32 _key, bytes32 _value) internal {
        bytes32Storage[_key] = _value;
    }

    function set(bytes32 _key, string memory _value) internal {
        stringStorage[_key] = _value;
    }

    function set(bytes32 _key, bytes memory _value) internal {
        bytesStorage[_key] = _value;
    }

    ////////////////////////////
    // deleteArray functions
    ////////////////////////////
    /// @notice Function used to delete the array element.
    /// Ex1- mapping(address => bytes32[]) tokensOwnedByOwner;
    /// For deleting the item from array developers needs to create a funtion for that similarly
    /// in this case we have the helper function deleteArrayBytes32() which will do it for us
    /// deleteArrayBytes32(keccak256(abi.encodePacked("tokensOwnedByOwner", 0x1), 3); -- it will delete the index 3

    //Deletes from mapping (bytes32 => array[]) at index _index
    function deleteArrayAddress(bytes32 _key, uint256 _index) internal {
        address[] storage array = addressArrayStorage[_key];
        require(
            _index < array.length,
            "Index should less than length of the array"
        );
        array[_index] = array[array.length - 1];
        array.pop();
    }

    //Deletes from mapping (bytes32 => bytes32[]) at index _index
    function deleteArrayBytes32(bytes32 _key, uint256 _index) internal {
        bytes32[] storage array = bytes32ArrayStorage[_key];
        require(
            _index < array.length,
            "Index should less than length of the array"
        );
        array[_index] = array[array.length - 1];
        array.pop();
    }

    //Deletes from mapping (bytes32 => uint[]) at index _index
    function deleteArrayUint(bytes32 _key, uint256 _index) internal {
        uint256[] storage array = uintArrayStorage[_key];
        require(
            _index < array.length,
            "Index should less than length of the array"
        );
        array[_index] = array[array.length - 1];
        array.pop();
    }

    //Deletes from mapping (bytes32 => string[]) at index _index
    function deleteArrayString(bytes32 _key, uint256 _index) internal {
        string[] storage array = stringArrayStorage[_key];
        require(
            _index < array.length,
            "Index should less than length of the array"
        );
        array[_index] = array[array.length - 1];
        array.pop();
    }

    ////////////////////////////
    //// pushArray functions
    ///////////////////////////
    /// @notice Below are the helper functions to facilitate storing arrays of different data types.
    /// Ex1- mapping(address => bytes32[]) tokensOwnedByTicker;
    /// tokensOwnedByTicker[owner] = tokensOwnedByTicker[owner].push("xyz"); replace with
    /// pushArray(keccak256(abi.encodePacked("tokensOwnedByTicker", owner), "xyz");

    /// @notice use to store the values for the array
    /// @param _key bytes32 type
    /// @param _value [uint256, string, bytes32, address] any of the data type in array
    function pushArray(bytes32 _key, address _value) internal {
        addressArrayStorage[_key].push(_value);
    }

    function pushArray(bytes32 _key, bytes32 _value) internal {
        bytes32ArrayStorage[_key].push(_value);
    }

    function pushArray(bytes32 _key, string memory _value) internal {
        stringArrayStorage[_key].push(_value);
    }

    function pushArray(bytes32 _key, uint256 _value) internal {
        uintArrayStorage[_key].push(_value);
    }

    /////////////////////////
    //// Set Array functions
    ////////////////////////
    /// @notice used to intialize the array
    /// Ex1- mapping (address => address[]) internal reputation;
    /// reputation[0x1] = new address[](0); It can be replaced as
    /// setArray(hash('reputation', 0x1), new address[](0));

    function setArray(bytes32 _key, address[] memory _value) internal {
        addressArrayStorage[_key] = _value;
    }

    function setArray(bytes32 _key, uint256[] memory _value) internal {
        uintArrayStorage[_key] = _value;
    }

    function setArray(bytes32 _key, bytes32[] memory _value) internal {
        bytes32ArrayStorage[_key] = _value;
    }

    // function setArray(bytes32 _key, string[] memory _value) internal {
    //     stringArrayStorage[_key] = _value;
    // }

    /////////////////////////
    /// getArray functions
    /////////////////////////
    /// @notice Get functions to get the array of the required data type
    /// Ex1- mapping(address => bytes32[]) tokensOwnedByOwner;
    /// getArrayBytes32(keccak256(abi.encodePacked("tokensOwnedByOwner", 0x1)); It return the bytes32 array
    /// Ex2- uint256 _len =  tokensOwnedByOwner[0x1].length; replace with
    /// getArrayBytes32(keccak256(abi.encodePacked("tokensOwnedByOwner", 0x1)).length;

    function getArrayAddress(bytes32 _key)
        public
        view
        returns (address[] memory)
    {
        return addressArrayStorage[_key];
    }

    function getArrayBytes32(bytes32 _key)
        public
        view
        returns (bytes32[] memory)
    {
        return bytes32ArrayStorage[_key];
    }

    function getArrayUint(bytes32 _key) public view returns (uint256[] memory) {
        return uintArrayStorage[_key];
    }

    ///////////////////////////////////
    /// setArrayIndexValue() functions
    ///////////////////////////////////
    /// @notice set the value of particular index of the address array
    /// Ex1- mapping(bytes32 => address[]) moduleList;
    /// general way is -- moduleList[moduleType][index] = temp;
    /// It can be re-write as -- setArrayIndexValue(keccak256(abi.encodePacked('moduleList', moduleType)), index, temp);

    function setArrayIndexValue(
        bytes32 _key,
        uint256 _index,
        address _value
    ) internal {
        addressArrayStorage[_key][_index] = _value;
    }

    function setArrayIndexValue(
        bytes32 _key,
        uint256 _index,
        uint256 _value
    ) internal {
        uintArrayStorage[_key][_index] = _value;
    }

    function setArrayIndexValue(
        bytes32 _key,
        uint256 _index,
        bytes32 _value
    ) internal {
        bytes32ArrayStorage[_key][_index] = _value;
    }

    function setArrayIndexValue(
        bytes32 _key,
        uint256 _index,
        string memory _value
    ) internal {
        stringArrayStorage[_key][_index] = _value;
    }

    /// Public getters functions
    /////////////////////// @notice Get function use to get the value of the singleton state variables
    /// Ex1- string public version = "0.0.1";
    /// string _version = getString(keccak256(abi.encodePacked("version"));
    /// Ex2 - assert(temp1 == temp2); replace to
    /// assert(getUint(keccak256(abi.encodePacked(temp1)) == getUint(keccak256(abi.encodePacked(temp2));
    /// Ex3 - mapping(string => SymbolDetails) registeredSymbols; where SymbolDetails is the structure having different type of values as
    /// {uint256 date, string name, address owner} etc.
    /// string _name = getString(keccak256(abi.encodePacked("registeredSymbols_name", "TOKEN"));

    function getUintValue(bytes32 _variable) public view returns (uint256) {
        return uintStorage[_variable];
    }

    function getBoolValue(bytes32 _variable) public view returns (bool) {
        return boolStorage[_variable];
    }

    function getStringValue(bytes32 _variable)
        public
        view
        returns (string memory)
    {
        return stringStorage[_variable];
    }

    function getAddressValue(bytes32 _variable) public view returns (address) {
        return addressStorage[_variable];
    }

    function getBytes32Value(bytes32 _variable) public view returns (bytes32) {
        return bytes32Storage[_variable];
    }

    function getBytesValue(bytes32 _variable)
        public
        view
        returns (bytes memory)
    {
        return bytesStorage[_variable];
    }
}
