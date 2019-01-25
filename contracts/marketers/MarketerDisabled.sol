// !@! MarketerDisabled:Madi:0.1.0:0.5.0:: !@!
//
//    /$$    /$$$$$$$$ /$$$$$$    /$$
//   | $$   |_____ $$//$$__  $$ /$$$$
//  /$$$$$$      /$$/|__/  \ $$|_  $$
// |_  $$_/     /$$/   /$$$$$$/  | $$
//   | $$      /$$/   /$$____/   | $$
//   | $$ /$$ /$$/   | $$        | $$
//   |  $$$$//$$/    | $$$$$$$$ /$$$$$$
//    \___/ |__/     |________/|______/
//  t721: 0.1.0, sol: 0.5.0

pragma solidity 0.5.0;

contract MarketerDisabled {

    bytes4 internal constant INTERFACE_SIGNATURE_MarketerDisabled =
    bytes4(keccak256('buy(uint256)'))
    ^ bytes4(keccak256('sell(uint256)'))
    ^ bytes4(keccak256('getMarketerSignature()'))
    ^ bytes4(keccak256('getSellPrice(uint256)'))
    ^ bytes4(keccak256('isInSale(uint256)'))
    ^ bytes4(keccak256('getMarketerInterfaceSignature()'));

    function buy(uint256) public pure {
        revert("Buying is disabled");
    }

    function sell(uint256) public pure {
        revert("Selling is disabled");
    }

    function getSellPrice(uint256) public pure returns (uint256) {
        revert("Selling is disabled");
        return 0;
    }

    function isInSale(uint256) public pure returns (bool) {
        return false;
    }

    function getMarketerSignature() public pure returns (string memory) {
        return "MarketerDisabled:0.1.0:0.5.0";
    }

    function marketer_set_T721(address) internal pure {}

    function configure_marketer() internal pure {}

    function getMarketerInterfaceSignature() public pure returns (bytes4) {
        return INTERFACE_SIGNATURE_MarketerDisabled;
    }

}
