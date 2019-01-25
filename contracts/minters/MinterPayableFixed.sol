// !@! MinterPayableFixed:Mipafi:0.1.0:0.5.0:uint256,uint256: !@!
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

import "../utility.sol";
import "../T721V0.sol";

contract MinterPayableFixed {

    uint256 private sell_price;
    uint256 private ticket_cap;
    uint256 private tickets_sold;
    address private t721;

    bytes4 internal constant INTERFACE_SIGNATURE_MinterPayableFixed =
    bytes4(keccak256('mint()'))
    ^ bytes4(keccak256('getMintPrince()'))
    ^ bytes4(keccak256('getTotalCount()'))
    ^ bytes4(keccak256('getSoldCount()'))
    ^ bytes4(keccak256('getTicketInfos(uint256)'))
    ^ bytes4(keccak256('getMinterInterfaceSignature()'))
    ^ bytes4(keccak256('getMinterSignature()'));

    function configure_minter(uint256 price, uint256 cap) internal {
        sell_price = price;
        ticket_cap = cap;
        tickets_sold = 0;
    }

    function mint() public payable {
        require(tickets_sold < ticket_cap, "All tickets sold out");
        utility.i_do_not_keep_the_change(sell_price);

        T721V0(t721).mint(msg.sender);
    }

    function getMintPrince() public view returns (uint256) {
        return sell_price;
    }

    function getTotalCount() public view returns (uint256) {
        return ticket_cap;
    }

    function getSoldCount() public view returns (uint256) {
        return tickets_sold;
    }

    function getTicketInfos(uint256) public pure returns (bytes32[] memory) {
        return new bytes32[](0);
    }

    function minter_set_T721(address _t721) internal {
        t721 = _t721;
    }

    function getMinterInterfaceSignature() public pure returns (bytes4) {
        return INTERFACE_SIGNATURE_MinterPayableFixed;
    }

    function getMinterSignature() public pure returns (string memory) {
        return "MinterPayableFixed:0.1.0:0.5.0";
    }
}
