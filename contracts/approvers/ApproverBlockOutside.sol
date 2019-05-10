// !@! ApproverBlockOutside:Apblou:0.1.0:0.5.0:: !@!
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

import "../ApproverInterface.sol";
import "../utility.sol";

contract ApproverBlockOutside is Approver {

    function allowed(address, address, uint256) public view returns (bool) {
        return false;
    }

    function market_allowed(address, address _to, uint256) public view returns (bool) {
        return !utility.isContract(_to);
    }

    function getApproverSignature() public view returns (string memory) {
        return "ApproverBlockOutside:0.1.0:0.5.0";
    }

    function approver_set_T721(address) internal pure {}

    function configure_approver() internal pure {}

}
