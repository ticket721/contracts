// !@! MinterPayableFixed:Mipafi:0.1.0:0.5.0:price uint256,cap uint256,end uint256: !@!
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
    uint256 private end;

    function configure_minter(uint256 price, uint256 cap, uint256 _end) internal {
        sell_price = price;
        ticket_cap = cap;
        tickets_sold = 0;
        end = _end;
    }

    function mint() public payable {
        require(block.timestamp < end, "Sale ended");
        require(tickets_sold < ticket_cap, "All tickets sold out");
        utility.i_do_not_keep_the_change(sell_price);

        T721V0(t721).mint(msg.sender, sell_price, address(0));
        tickets_sold += 1;
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

    function stringToBytes32(string memory source) internal pure returns (bytes32 result) {
        assembly {
            result := mload(add(source, 32))
        }
    }

    function getTicketInfos(uint256) public view returns (bytes32[] memory) {
        bytes32[] memory ret = new bytes32[](1);
        ret[0] = stringToBytes32("regular");
        return ret;
    }

    function uint2str(uint _i) internal pure returns (string memory _uintAsString) {
        if (_i == 0) {
            return "0";
        }
        uint j = _i;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len - 1;
        while (_i != 0) {
            bstr[k--] = byte(uint8(48 + _i % 10));
            _i /= 10;
        }
        return string(bstr);
    }

    function getEventURI(uint256 _ticket_id) public view returns (string memory _uri) {
        string memory server = T721V0(t721).get_server();
        string memory ticket_id = uint2str(_ticket_id);
        return string(abi.encodePacked(server, ticket_id));
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
