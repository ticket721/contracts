// !@! ApproverDisabled:Apdi:0.1.0:0.5.0:: !@!
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

contract Approver {

    bytes4 internal constant INTERFACE_SIGNATURE_ApproverDisabled =
    bytes4(keccak256('allowed(address,address,uint256)'))
    ^ bytes4(keccak256('getApproverSignature()'))
    ^ bytes4(keccak256('getApproverInterfaceSignature()'));

    function allowed(address, address, uint256) public view returns (bool);
    function getApproverSignature() public view returns (string memory);

    function getApproverInterfaceSignature() public pure returns (bytes4) {
        return INTERFACE_SIGNATURE_ApproverDisabled;
    }

}
