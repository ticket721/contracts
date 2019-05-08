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

contract Minter {

    function getEventURI(uint256) public view returns (string memory);
    function getTicketInfos(uint256) public view returns (bytes32[] memory);
    function getMinterSignature() public pure returns (string memory);

}
