pragma solidity >=0.4.21 <0.6.0;

import "zos-lib/contracts/Initializable.sol";

contract Contract is Initializable {
    address public owner;

    function initialize() initializer public {
        owner = msg.sender;
    }

}
