/*$${{ARG_LIST}}$$*/

//
//    /$$    /$$$$$$$$ /$$$$$$    /$$
//   | $$   |_____ $$//$$__  $$ /$$$$
//  /$$$$$$      /$$/|__/  \ $$|_  $$
// |_  $$_/     /$$/   /$$$$$$/  | $$
//   | $$      /$$/   /$$____/   | $$
//   | $$ /$$ /$$/   | $$        | $$
//   |  $$$$//$$/    | $$$$$$$$ /$$$$$$
//    \___/ |__/     |________/|______/
//  t721: /*$${{T721_VERSION}}$$*/, sol: /*$${{SOLC_VERSION}}$$*/

/*$${{DESCRIPTIONS}}$$*/

pragma solidity /*$${{SOLC_VERSION}}$$*/;

import "zos-lib/contracts/Initializable.sol";

/*$${{IMPORTS}}$$*/

contract EventV0/*$${{NAME}}$$*/ is Initializable/*$${{INHERITANCE}}$$*/ {

    address private t721;
    string private _uri;

    function initialize(address _t721/*$${INITIALIZER_ARGS}$$*/) public initializer {
        t721 = _t721;
        minter_set_T721(_t721);
        marketer_set_T721(_t721);
        approver_set_T721(_t721);
/*$${INITIALIZER_BODY}$$*/
    }

    function supportsInterface(bytes4 _interface) public pure returns (bool) {
        return ((_interface == getMarketerInterfaceSignature())
        || (_interface == getMinterInterfaceSignature())
        || (_interface == getApproverInterfaceSignature()));
    }

}
