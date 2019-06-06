// !@! MinterPayableFixedCategories:Mipafica:0.1.0:0.5.0:names bytes32[] memory,prices uint256[] memory,caps uint256[] memory,end uint256: !@!
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

contract MinterPayableFixedCategories is Minter {

    mapping (bytes32 => uint256) private sell_prices;
    mapping (bytes32 => uint256) private ticket_caps;
    mapping (bytes32 => uint256) private tickets_sold;
    mapping (uint256 => bytes32) private id_to_type;
    bytes32[] private categories;
    address private t721;
    uint256 private end;

    function configure_minter(bytes32[] memory names, uint256[] memory prices, uint256[] memory caps, uint256 _end) internal {
        require(names.length == prices.length, "Invalid number of names and prices");
        require(names.length == caps.length, "Invalid number of names and caps");

        for (uint256 idx = 0; idx < names.length; ++idx) {
            sell_prices[names[idx]] = prices[idx];
            ticket_caps[names[idx]] = caps[idx];
            tickets_sold[names[idx]] = 0;
        }

        categories = names;

        end = _end;
    }

    function mint(bytes32 ticket_type) public payable {
        require(block.timestamp < end, "Sale ended");
        require(tickets_sold[ticket_type] < ticket_caps[ticket_type], "All tickets sold out");
        utility.i_do_not_keep_the_change(sell_prices[ticket_type]);

        uint256 id = T721V0(t721).mint(msg.sender, sell_prices[ticket_type], address(0));
        tickets_sold[ticket_type] += 1;
        id_to_type[id] = ticket_type;
    }

    function getMintPrice(bytes32 ticket_type) public view returns (uint256) {
        return sell_prices[ticket_type];
    }

    function getTotalCount(bytes32 ticket_type) public view returns (uint256) {
        return ticket_caps[ticket_type];
    }

    function getSoldCount(bytes32 ticket_type) public view returns (uint256) {
        return tickets_sold[ticket_type];
    }

    function getCategories() public view returns (bytes32[] memory) {
        return categories;
    }

    function getTicketInfos(uint256 id) public view returns (bytes32[] memory) {
        bytes32[] memory ret = new bytes32[](1);
        ret[0] = id_to_type[id];
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
        return "MinterPayableFixedCategories:0.1.0:0.5.0";
    }

}
