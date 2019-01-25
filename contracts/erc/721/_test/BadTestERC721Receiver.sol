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

contract BadTestERC721Receiver {

    uint256 public last_received_token;
    bytes public last_received_data;

    bytes4 constant ERC721_RECEIVED = 0xf0b9e5bb;

    function onERC721Received(address, uint256 _ticket_id, bytes memory _data) public returns(bytes4) {
        last_received_token = _ticket_id;
        last_received_data = _data;
        return ERC721_RECEIVED;
    }

}
