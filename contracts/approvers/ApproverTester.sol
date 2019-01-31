// !@! ApproverTester:Apte:0.1.0:0.5.0:: !@!
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

contract ApproverTester is Approver {

    function allowed(address, address, uint256) public view returns (bool) {
        return false;
    }

    function getApproverSignature() public view returns (string memory) {
        return "ApproverTester:0.1.0:0.5.0";
    }

    function approver_set_T721(address) internal pure {}

    function configure_approver() internal pure {}

}
