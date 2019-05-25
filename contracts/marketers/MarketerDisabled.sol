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

import "../MarketerInterface.sol";

contract MarketerDisabled is Marketer {

    function buy(uint256) pure public {
        revert("[Madi] Buying is disabled");
    }

    function sell(uint256) pure public {
        revert("[Madi] Selling is disabled");
    }

    function getSellPrice(uint256) public view returns (uint256) {
        revert("[Madi] Selling is disabled");
        return 0;
    }

    function getMarketerSignature() public pure returns (string memory) {
        return "MarketerDisabled:0.1.0:0.5.0";
    }

    function marketer_set_T721(address) internal pure {}

    function configure_marketer() internal pure {}

}
