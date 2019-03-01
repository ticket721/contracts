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
import "./dtypes.sol";

contract AdministrationBoardV0 is Initializable {

    event AdditionVote(address indexed _new_admin);
    event NewAdmin(address indexed _admin);
    event AdditionRefused(address indexed _new_admin);

    event KickVote(address indexed _admin);
    event DeleteAdmin(address indexed _admin);
    event KickRefused(address indexed _admin);

    mapping (address => bool) internal members;
    uint256 internal member_count;
    mapping (address => dtypes.Votes) internal addition_votes;
    mapping (address => dtypes.Votes) internal kick_votes;
    uint256 internal vote_percent;

    /// @notice ZeppelinOs Initializer. Used as an asynchronous constructor for the proxy.
    /// @param _owner Address of the system's owner, first member
    /// @param _vote_percent Required member percent for a vote to be valid
    function initialize(address _owner, uint256 _vote_percent) public initializer {
        members[_owner] = true;
        member_count = 1;
        vote_percent = _vote_percent;
        emit NewAdmin(_owner);
    }

    modifier memberOnly() {
        require(members[msg.sender] == true, "This method is reserved to members only");
        _;
    }

    /// @notice Query to check if an address is a board member
    /// @param _member Address to check
    /// @return `true` if member
    function isMember(address _member) public view returns (bool) {
        return members[_member];
    }

    /// @notice Query to get status of a vote
    /// @dev Invalid _vote value throws
    /// @dev If no vote is live, throws
    /// @param _vote Vote type, `1` for Addition Vote, `2` for Kick Vote
    /// @param _target Recipient targeted by the vote
    /// @return yes, no Number of yes and no votes
    function getVote(uint8 _vote, address _target) public view returns (uint256 yes, uint256 no) {
        if (_vote == 1) {
            require(addition_votes[_target].live == true, "There is no addition vote for given recipient");
            return (addition_votes[_target].yes, addition_votes[_target].no);
        } else if (_vote == 2) {
            require(kick_votes[_target].live == true, "There is no kick vote for given recipient");
            return (kick_votes[_target].yes, kick_votes[_target].no);
        } else {
            revert("Set _vote to 1 for addition, 2 for kick");
        }
    }

    /// @notice Query to check if a vote has ended, takes percent into account
    /// @param _vote_count Vote count
    /// @return `true` if vote is valid with given count
    function checkVote(uint256 _vote_count) public view returns (bool) {
        return (_vote_count > ((member_count * vote_percent) / 100));
    }

    /// @notice Start a vote to add a new member
    /// @dev Only members can call this method
    /// @param _new_member Address to add
    function addMember(address _new_member) public memberOnly {
        require(members[_new_member] == false, "The recipient is already a member");
        require(addition_votes[_new_member].live == false, "The vote already started");

        addition_votes[_new_member].live = true;
        emit AdditionVote(_new_member);
    }

    /// @notice Query to check if Addition Vote is live
    /// @param _new_member Target of vote
    /// @return `true` if live
    function isAddVoteLive(address _new_member) public view returns (bool) {
        return addition_votes[_new_member].live;
    }

    /// @notice Vote on an Addition Vote
    /// @dev Only members can call this method
    /// @param _new_member Target address of the vote
    /// @param _vote `true` to add, `false` to refuse
    function voteAdd(address _new_member, bool _vote) public memberOnly {
        require(addition_votes[_new_member].live == true, "There is no vote for given recipient");

        if (addition_votes[_new_member].registry[msg.sender] != 0) {

            if (addition_votes[_new_member].registry[msg.sender] == 1) {
                if (_vote == true) revert("You already voted yes");
                addition_votes[_new_member].yes -= 1;
            } else {
                if (_vote == false) revert("You already voted no");
                addition_votes[_new_member].no -= 1;
            }

            addition_votes[_new_member].count -= 1;

        }

        if (_vote) {
            addition_votes[_new_member].yes += 1;
            addition_votes[_new_member].registry[msg.sender] = 1;
            addition_votes[_new_member].count += 1;

            if (checkVote(addition_votes[_new_member].yes)) {
                members[_new_member] = true;
                member_count += 1;
                delete addition_votes[_new_member];
                emit NewAdmin(_new_member);
            }

        } else {
            addition_votes[_new_member].no += 1;
            addition_votes[_new_member].registry[msg.sender] = 2;
            addition_votes[_new_member].count += 1;

            if (checkVote(addition_votes[_new_member].no)) {
                delete addition_votes[_new_member];
                emit AdditionRefused(_new_member);
            }

        }


    }

    /// @notice Start a vote to kick a member
    /// @dev Only members can call this method
    /// @param _member Address to kick
    function kickMember(address _member) public memberOnly {
        require(members[_member] == true, "The recipient is not a member of the board");
        require(kick_votes[_member].live == false, "The vote already started");
        require(msg.sender != _member, "Use leave() to leave the group");

        kick_votes[_member].live = true;
        emit KickVote(_member);
    }

    /// @notice Query to check if Kick Vote is live
    /// @param _member Target of vote
    /// @return `true` if live
    function isKickVoteLive(address _member) public view returns (bool) {
        return kick_votes[_member].live;
    }

    /// @notice Vote on an Kick Vote
    /// @dev Only members can call this method
    /// @param _member Target address of the vote
    /// @param _vote `true` to kick, `false` to refuse
    function voteKick(address _member, bool _vote) public memberOnly {
        require(kick_votes[_member].live == true, "There is no vote for given recipient");

        if (kick_votes[_member].registry[msg.sender] != 0) {

            if (kick_votes[_member].registry[msg.sender] == 1) {
                if (_vote == true) revert("You already voted yes");
                kick_votes[_member].yes -= 1;
            } else {
                if (_vote == false) revert("You already voted no");
                kick_votes[_member].no -= 1;
            }

            kick_votes[_member].count -= 1;
        }

        if (_vote) {
            kick_votes[_member].yes += 1;
            kick_votes[_member].registry[msg.sender] = 1;
            kick_votes[_member].count += 1;

            if (checkVote(kick_votes[_member].yes)) {
                delete members[_member];
                member_count -= 1;
                delete kick_votes[_member];
                emit DeleteAdmin(_member);
            }

        } else {
            kick_votes[_member].no += 1;
            kick_votes[_member].registry[msg.sender] = 2;
            kick_votes[_member].count += 1;

            if (checkVote(kick_votes[_member].no)) {
                delete kick_votes[_member];
                emit KickRefused(_member);
            }

        }
    }

    /// @notice Leave the administration board
    /// @dev Only members can call this method
    function leave() public memberOnly {
        delete addition_votes[msg.sender];
        delete kick_votes[msg.sender];
        delete members[msg.sender];
        member_count -= 1;
        emit DeleteAdmin(msg.sender);
    }
}
