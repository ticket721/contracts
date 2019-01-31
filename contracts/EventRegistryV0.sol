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
import "./EventManagersRegistryV0.sol";
import "./utility.sol";
import "./dtypes.sol";

contract EventRegistryV0 is Initializable {

    address private admin_board;
    address private manager_registry;
    mapping (address => bool) private events;
    mapping (address => dtypes.Votes) private kick_votes;

    event Event(address _adder, address _event);
    event KickedEvent(address _event);
    event KickFailed(address _event);

    /// @notice ZeppelinOs Initializer. Used as an asynchronous constructor for the proxy.
    /// @param _admin_board Address of the system's administration board
    /// @param _manager_registry Address of the system's manager registry
    function initialize(address _admin_board, address _manager_registry) public initializer {
        admin_board = _admin_board;
        manager_registry = _manager_registry;
    }

    modifier _contract(address _address) {
        require(_address != address(0), "Cannot add 0 address");
        require(utility.isContract(_address) == true, "Given address is not a contract");
        _;
    }

    modifier _events(address _event) {
        require(events[_event] == true, "Given address is not an event");
        _;
    }

    modifier boardMember() {
        require(AdministrationBoardV0(admin_board).isMember(msg.sender), "This action is reserved to board members only");
        _;
    }

    modifier manager() {
        require(EventManagersRegistryV0(manager_registry).isManager(msg.sender), "This action is reserved to managers only");
        _;
    }

    /// @notice Registers an address as an event
    /// @dev Only managers are allowed to call this method
    /// @dev `revert` if address is not a contract
    /// @param _event Address of the event to add
    function registerEvent(address _event) public manager _contract(_event) {
        // TODO Efficiently verify that correct contract is calling
        events[_event] = true;
        emit Event(msg.sender, _event);
    }

    /// @notice Query to check if an address is a registered event
    /// @param _event Address of the event to check
    /// @return `true` if address is an event
    function isRegistered(address _event) public view returns (bool) {
        return events[_event];
    }

    /// @notice Start vote to kick an event
    /// @dev only board members are allowed to call this method
    /// @param _event Address of the event to kick
    function kickEvent(address _event) public boardMember _events(_event) {
        require(kick_votes[_event].live == false, "Vote already live for event");

        kick_votes[_event].live = true;
    }

    /// @notice Query to check if a kick vote is live for specified address
    /// @param _event Address of the event to check
    /// @return `true` if address is being vote kicked
    function isKickVoteLive(address _event) public view returns (bool) {
        return kick_votes[_event].live;
    }

    /// @notice Vote to kick or keep an address
    /// @dev A vote should be started before calling this method
    /// @dev Only board members are allowed to call this method
    /// @param _event Address of the event
    /// @param _vote `true` to kick
    function voteKick(address _event, bool _vote) public boardMember _events(_event) {
        require(kick_votes[_event].live == true, "There is no vote for given event");

        if (kick_votes[_event].registry[msg.sender] != 0) {

            if (kick_votes[_event].registry[msg.sender] == 1) {
                if (_vote == true) revert("You already voted yes");
                kick_votes[_event].yes -= 1;
            } else {
                if (_vote == false) revert("You already voted no");
                kick_votes[_event].no -= 1;
            }

            kick_votes[_event].count -= 1;

        }

        if (_vote) {
            kick_votes[_event].yes += 1;
            kick_votes[_event].registry[msg.sender] = 1;
            kick_votes[_event].count += 1;

            if (AdministrationBoardV0(admin_board).checkVote(kick_votes[_event].yes)) {
                delete events[_event];
                delete kick_votes[_event];
                emit KickedEvent(_event);
            }

        } else {
            kick_votes[_event].no += 1;
            kick_votes[_event].registry[msg.sender] = 2;
            kick_votes[_event].count += 1;

            if (AdministrationBoardV0(admin_board).checkVote(kick_votes[_event].no)) {
                delete kick_votes[_event];
                emit KickFailed(_event);
            }

        }
    }

}
