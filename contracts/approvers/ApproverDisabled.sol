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

contract ApproverDisabled {

    bytes4 internal constant INTERFACE_SIGNATURE_ApproverDisabled =
    bytes4(keccak256('allowed(address,address,uint256)'))
    ^ bytes4(keccak256('getApproverSignature()'))
    ^ bytes4(keccak256('getApproverInterfaceSignature()'));

    function allowed(address, address, uint256) public pure returns (bool) {
        return true;
    }

    function getApproverInterfaceSignature() public pure returns (bytes4) {
        return INTERFACE_SIGNATURE_ApproverDisabled;
    }

    function getApproverSignature() public pure returns (string memory) {
        return "ApprovedDisabled:0.1.0:0.5.0";
    }

    function approver_set_T721(address) internal pure {}

    function configure_approver() internal pure {}

}
