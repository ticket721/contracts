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

import "zos-lib/contracts/Initializable.sol";
import "./AdministrationBoardV0.sol";
import "./utility.sol";

contract EventManagersRegistryV0 is Initializable {

    address private board;
    mapping (address => uint256) members;
    address[] private member_list;
    uint256 private member_count;

    event Manager(address indexed _manager, address indexed _adder);
    event RemovedManager(address indexed _manager, address indexed _remover);
    event LeftManager(address indexed _manager);

    /// @notice ZeppelinOs Initializer. Used as an asynchronous constructor for the proxy.
    /// @param _board Address of the system's administration board
    function initialize(address _board) public initializer {
        board = _board;
        member_list.push(address(0));
        member_count = 0;
    }

    modifier user(address _address) {
        require(utility.isContract(_address) == false, "Given address is a contract");
        _;
    }

    modifier boardOnly() {
        require(AdministrationBoardV0(board).isMember(msg.sender) == true, "Only Board members are allowed");
        _;
    }

    modifier managerOnly {
        require(isManager(msg.sender) == true, "Only Managers are allowed");
        _;
    }

    modifier zero(address _address) {
        require(_address != address(0), "0 address is invalid");
        _;
    }

    /// @notice Query is an address is a manager
    /// @param _manager Address to check
    /// @return `true` if _manager is a manager
    function isManager(address _manager) public zero(_manager) view returns (bool) {
        return members[_manager] != 0;
    }

    /// @notice Query to get the manager count
    /// @return _manager_count The number of registered managers
    function getManagerCount() public view returns (uint256 _manager_count) {
        return member_count;
    }

    /// @notice Query to get a manager by index
    /// @param _index The global index of the manager
    /// @return _manager The manager at the requested index
    function getManagerByIndex(uint256 _index) public view returns (address _manager) {
        require(_index < member_count, "Index out of range");

        uint256 real_idx = 0;

        for (uint256 idx = 0; idx < member_list.length; ++idx) {

            if (member_list[idx] != address(0)) {

                if (real_idx == _index) {
                    return member_list[idx];
                } else {
                    ++real_idx;
                }

            }

        }
    }

    /// @notice Method to add a new manager
    /// @dev Only board members are allowed to call this method
    /// @param _new_manager The address of the new manager
    function addManager(address _new_manager) public zero(_new_manager) user(_new_manager) boardOnly {
        require(members[_new_manager] == 0, "Recipient is already an event manager");
        members[_new_manager] = member_list.push(_new_manager) - 1;
        ++member_count;

        emit Manager(_new_manager, msg.sender);
    }

    /// @notice Method to remove a manager
    /// @dev Only board members are allowed to call this method
    /// @param _manager The address of the manager to remove
    function removeManager(address _manager) public zero(_manager) boardOnly {
        require(members[_manager] != 0, "Recipient is not an event manager");
        require(_manager != msg.sender, "Use method leave()");

        delete member_list[members[_manager]];
        delete members[_manager];
        --member_count;

        emit RemovedManager(_manager, msg.sender);
    }

    /// @notice Method to leave the registry
    function leave() public managerOnly {
        delete member_list[members[msg.sender]];
        delete members[msg.sender];
        --member_count;

        emit LeftManager(msg.sender);
    }

}
