// !@! MarketerTester:Mate:0.1.0:0.5.0::uint256,uint256 !@!
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
import "../T721V0.sol";
import "../utility.sol";

contract MarketerTester is Marketer {

    address internal t721;
    mapping (uint256 => uint256) price;

    function buy(uint256 _ticket_id) public payable {
        utility.i_do_not_keep_the_change(price[_ticket_id]);
        T721V0(t721).buy(_ticket_id, msg.sender);
        delete price[_ticket_id];
    }

    function sell(uint256 _ticket_id, uint256 _price, uint256 _end) public {
        require(T721V0(t721).ownerOf(_ticket_id) == msg.sender, "You are not the owner of the ticket");
        T721V0(t721).openSale(1, _end);
        price[_ticket_id] = _price;
    }

    function test_closeSale(uint256 _ticket_id) public {
        require(T721V0(t721).ownerOf(_ticket_id) == msg.sender, "You are not the owner of the ticket");
        T721V0(t721).closeSale(1);
    }

    function getSellPrice(uint256 _ticket_id) public view returns (uint256) {
        return price[_ticket_id];
    }

    function getMarketerSignature() public pure returns (string memory) {
        return "MarketerTester:0.1.0:0.5.0";
    }

    function marketer_set_T721(address _t721) internal {
        t721 = _t721;
    }

    function configure_marketer() internal pure {}

}