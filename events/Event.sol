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

import "../T721V0.sol";
/*$${{IMPORTS}}$$*/

contract Event/*$${{NAME}}$$*/ is /*$${{INHERITANCE}}$$*/ {

    address private t721;
    string private _uri;
    address public owner;

    function start() public {
        // TODO activate everything
        require(msg.sender == owner, "Only owner can start event");
        T721V0(t721).register(owner);
    }

    function withdraw(uint amount) public {
        require(msg.sender == owner, "Only owner can withdraw funds");
        require(address(this).balance >= amount, "Insuficient funds");
        msg.sender.transfer(amount);
    }

    constructor(address _t721/*$${INITIALIZER_ARGS}$$*/) public {
        t721 = _t721;
        minter_set_T721(_t721);
        marketer_set_T721(_t721);
        approver_set_T721(_t721);
        owner = msg.sender;
/*$${INITIALIZER_BODY}$$*/
    }

}
