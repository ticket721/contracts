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

    bytes4 internal constant INTERFACE_SIGNATURE_Minter =
    bytes4(keccak256('getMintPrince()'))
    ^ bytes4(keccak256('getTotalCount()'))
    ^ bytes4(keccak256('getSoldCount()'))
    ^ bytes4(keccak256('getTicketInfos(uint256)'))
    ^ bytes4(keccak256('getMinterInterfaceSignature()'))
    ^ bytes4(keccak256('getMinterSignature()'));


    function getMintPrice() public view returns (uint256);

    function getTotalCount() public view returns (uint256);

    function getSoldCount() public view returns (uint256);

    function getTicketInfos(uint256) public view returns (bytes32[] memory);

    function getEventURI(uint256 _ticket_id) public view returns (string memory _uri);
    function getSaleEnd() public view returns (uint256 _end);

    function getMinterInterfaceSignature() public pure returns (bytes4) {
        return INTERFACE_SIGNATURE_Minter;
    }

}
