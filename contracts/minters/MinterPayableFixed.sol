// !@! MinterPayableFixed:Mipafi:0.1.0:0.5.0:uint256,uint256,uint256,string memory: !@!
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
import "../MinterInterface.sol";

contract MinterPayableFixed is Minter {

    uint256 private sell_price;
    uint256 private ticket_cap;
    uint256 private tickets_sold;
    address private t721;
    string private uri;
    uint256 private end;

    function configure_minter(uint256 price, uint256 cap, uint256 _end, string memory _uri) internal {
        sell_price = price;
        ticket_cap = cap;
        tickets_sold = 0;
        uri = _uri;
        end = _end;
    }

    function mint() public payable {
        require(tickets_sold < ticket_cap, "All tickets sold out");
        utility.i_do_not_keep_the_change(sell_price);

        T721V0(t721).mint(msg.sender);
    }

    function getMintPrice() public view returns (uint256) {
        return sell_price;
    }

    function getTotalCount() public view returns (uint256) {
        return ticket_cap;
    }

    function getSoldCount() public view returns (uint256) {
        return tickets_sold;
    }

    function getTicketInfos(uint256) public view returns (bytes32[] memory) {
        return new bytes32[](0);
    }

    function getEventURI(uint256) public view returns (string memory _uri) {
        return uri;
    }

    function getSaleEnd() public view returns (uint256 _end) {
        return end;
    }

    function minter_set_T721(address _t721) internal {
        t721 = _t721;
    }

    function getMinterSignature() public pure returns (string memory) {
        return "MinterPayableFixed:0.1.0:0.5.0";
    }

}
