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

contract Marketer {

    bytes4 internal constant INTERFACE_SIGNATURE_Marketer =
    bytes4(keccak256('getMarketerSignature()'))
    ^ bytes4(keccak256('getSellPrice(uint256)'))
    ^ bytes4(keccak256('getMarketerInterfaceSignature()'));

    function getSellPrice(uint256) public view returns (uint256);
    function getMarketerSignature() public pure returns (string memory);

    function getMarketerInterfaceSignature() public pure returns (bytes4) {
        return INTERFACE_SIGNATURE_Marketer;
    }

}
