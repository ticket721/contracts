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

import "./erc/165/ERC165.sol";
import "./erc/721/ERC721Basic.sol";
import "./erc/721/ERC721Receiver.sol";
import "./ApproverInterface.sol";
import "./MinterInterface.sol";
import "zos-lib/contracts/Initializable.sol";
import "./utility.sol";
import "./AdministrationBoardV0.sol";

contract T721V0 is Initializable, ERC165, ERC721Basic {

    using utility for T721V0;

    uint256 internal                                            ticket_id;
    mapping (address => uint256[]) internal                     tickets_by_owner;
    mapping (uint256 => address) internal                       owner_by_ticket;
    mapping (uint256 => address) internal                       approved_by_ticket;
    mapping (uint256 => address) internal                       issuer_by_ticket;
    mapping (uint256 => uint256) internal                       index_by_ticket;
    mapping (address => mapping (address => bool)) internal     approvals_for_all_by_user;
    mapping (uint256 => uint256) internal                       sale_by_ticket;
    mapping (bytes32 => bool) internal                          event_code_checksums;
    string internal                                             t721_name;
    string internal                                             t721_symbol;
    string internal                                             server;
    address internal                                            event_registry;
    address internal                                            admin_board;

    modifier admin() {
        require(AdministrationBoardV0(admin_board).isMember(msg.sender) == true, "[T721] Method reserved for Administration Board Members");
        _;
    }

    modifier zero(address _to) {
        require(_to != address(0), "[T721] 0x0000000000000000000000000000000000000000 is not a valid owner");
        _;
    }

    modifier ticket(uint256 _ticket_id) {
        require(_ticket_id != 0, "[T721] 0 is an invalid ticket id");
        _;
    }

    modifier ticket_exists(uint256 _ticket_id) {
        require(exists(_ticket_id) == true, "[T721] Ticket does not exists");
        _;
    }

    modifier owner(uint256 _ticket_id, address _owner) {
        require(ownerOf(_ticket_id) == _owner, "[T721] Method reserved for the ticket owner");
        _;
    }

    modifier eventOnly() {
        require(whitelisted_events(msg.sender) == true, "[T721] On-Chain code is not whitelisted");
        _;
    }

    modifier issuer(uint256 _ticket_id) {
        require(issuer_by_ticket[_ticket_id] == msg.sender, "[T721] Only ticket issuer is allowed to call this method");
        _;
    }

    event Event(address indexed _adder, address indexed _event);

    //   /$$$$$$$$  /$$$$$$   /$$$$$$$
    //  |____ /$$/ /$$__  $$ /$$_____/
    //     /$$$$/ | $$  \ $$|  $$$$$$
    //    /$$__/  | $$  | $$ \____  $$
    //   /$$$$$$$$|  $$$$$$/ /$$$$$$$/
    //  |________/ \______/ |_______/

    function initialize(address _admin_board, string memory _name, string memory _symbol, string memory _server) public initializer {
        ticket_id = 1;
        t721_name = _name;
        t721_symbol = _symbol;
        admin_board = _admin_board;
        server = _server;
    }

    function get_server() public view returns (string memory) {
        return server;
    }

    function set_server(string memory _server) public admin {
        server = _server;
    }

    function register(address _owner) public eventOnly {
        emit Event(_owner, msg.sender);
    }

    function whitelisted_events(address _event) internal view returns (bool) {

        bytes32 code = keccak256(utility.codeAt(_event));

        return event_code_checksums[code];

    }

    function set_event_code(bytes memory _code, bool _value) public admin {
        bytes32 checksum = keccak256(_code);

        event_code_checksums[checksum] = _value;
    }

    //                                   /$$    /$$$$$$  /$$$$$$$
    //                                 /$$$$   /$$__  $$| $$____/
    //    /$$$$$$   /$$$$$$   /$$$$$$$|_  $$  | $$  \__/| $$
    //   /$$__  $$ /$$__  $$ /$$_____/  | $$  | $$$$$$$ | $$$$$$$
    //  | $$$$$$$$| $$  \__/| $$        | $$  | $$__  $$|_____  $$
    //  | $$_____/| $$      | $$        | $$  | $$  \ $$ /$$  \ $$
    //  |  $$$$$$$| $$      |  $$$$$$$ /$$$$$$|  $$$$$$/|  $$$$$$/
    //   \_______/|__/       \_______/|______/ \______/  \______/

    bytes4 public constant INTERFACE_SIGNATURE_ERC165 =
    bytes4(keccak256('supportsInterface(bytes4)'));

    bytes4 public constant INTERFACE_SIGNATURE_ERC721Basic =
    bytes4(keccak256('balanceOf(address)')) ^
    bytes4(keccak256('ownerOf(uint256)')) ^
    bytes4(keccak256('exists(uint256)')) ^
    bytes4(keccak256('approve(address,uint256)')) ^
    bytes4(keccak256('getApproved(uint256)')) ^
    bytes4(keccak256('setApprovalForAll(address,bool)')) ^
    bytes4(keccak256('isApprovedForAll(address,address)')) ^
    bytes4(keccak256('transferFrom(address,address,uint256)')) ^
    bytes4(keccak256('safeTransferFrom(address,address,uint256)')) ^
    bytes4(keccak256('safeTransferFrom(address,address,uint256,bytes)'));

    bytes4 public constant INTERFACE_SIGNATURE_ERC721Enumerable =
    bytes4(keccak256('totalSupply()')) ^
    bytes4(keccak256('tokenOfOwnerByIndex(address,uint256)')) ^
    bytes4(keccak256('tokenByIndex(uint256)'));

    bytes4 public constant INTERFACE_SIGNATURE_ERC721Metadata =
    bytes4(keccak256('name()')) ^
    bytes4(keccak256('symbol()')) ^
    bytes4(keccak256('tokenURI(uint256)'));

    /// @notice Query if a contract implements an interface
    /// @param _interface_id The interface identifier, as specified in ERC-165
    /// @dev Interface identification is specified in ERC-165. This function
    ///  uses less than 30,000 gas.
    /// @return `true` if the contract implements `interfaceID` and
    ///  `interfaceID` is not 0xffffffff, `false` otherwise
    function supportsInterface(bytes4 _interface_id) external view returns (bool) {
        return (
        (_interface_id == INTERFACE_SIGNATURE_ERC165) ||
        (_interface_id == INTERFACE_SIGNATURE_ERC721Basic)  ||
        (_interface_id == INTERFACE_SIGNATURE_ERC721Enumerable) ||
        (_interface_id == INTERFACE_SIGNATURE_ERC721Metadata)
        );
    }

    /// @notice the core transfer mechanism
    /// @param _from The current owner of the NFT
    /// @param _to The new owner
    /// @param _ticket_id The NFT to transfer
    /// @param _raw used to differentiate marketplace action from standalone transfer, and apply approver constraints if needed
    function raw_transfer(address _from, address _to, uint256 _ticket_id, bool _raw) private
    zero(_from)
    zero(_to)
    ticket(_ticket_id)
    ticket_exists(_ticket_id)
    owner(_ticket_id, _from)
    {
        require((
            (msg.sender == _from) || // Caller owns the ticket
            (getApproved(_ticket_id) == msg.sender) || // Ticket owner gave right to msg.sender to operate on this ticket
            (isApprovedForAll(_from, msg.sender) == true) // Ticket owner gave right to msg.sender to operate on all his tickets
            ), "[T721] You don't have the required rights");

        require(isSaleOpen(_ticket_id) == false, "[T721] Ticket is currently in sale");

        if (whitelisted_events(issuer_by_ticket[_ticket_id]) == true) {
            if (_raw == true) {
                require(Approver(issuer_by_ticket[_ticket_id]).allowed(_from, _to, _ticket_id) == true, "[T721] Event is not allowing this transfer");
            } else {
                require(Approver(issuer_by_ticket[_ticket_id]).market_allowed(_from, _to, _ticket_id) == true, "[T721] Event is not allowing this marketplace transfer");
            }
        }

        delete tickets_by_owner[_from][index_by_ticket[_ticket_id]];

        if (approved_by_ticket[_ticket_id] != address(0)) {
            delete approved_by_ticket[_ticket_id];
        }

        owner_by_ticket[_ticket_id] = _to;
        uint256 ticket_index = tickets_by_owner[_to].push(_ticket_id) - 1;
        index_by_ticket[_ticket_id] = ticket_index;

        emit Transfer(_from, _to, _ticket_id);

    }

    //     /$$    /$$$$$$$$ /$$$$$$    /$$
    //    | $$   |_____ $$//$$__  $$ /$$$$
    //   /$$$$$$      /$$/|__/  \ $$|_  $$
    //  |_  $$_/     /$$/   /$$$$$$/  | $$
    //    | $$      /$$/   /$$____/   | $$
    //    | $$ /$$ /$$/   | $$        | $$
    //    |  $$$$//$$/    | $$$$$$$$ /$$$$$$
    //     \___/ |__/     |________/|______/

    event Mint(address indexed _issuer, uint256 indexed _ticket_id, address indexed _owner, uint256 _price, address _currency);
    event Sale(address indexed _issuer, uint256 indexed _ticket_id, address indexed _owner, uint256 _end);
    event SaleClose(address indexed _issuer, uint256 indexed _ticket_id, address indexed _owner);
    event Buy(address indexed _issuer, uint256 indexed _ticket_id, address indexed _new_owner, address _old_owner, uint256 _price, address _currency);

    function mint(address _to, uint256 _price, address _currency) public
    zero(_to)
    returns (uint256)
    {

        owner_by_ticket[ticket_id] = _to;
        uint256 ticket_index = tickets_by_owner[_to].push(ticket_id) - 1;
        issuer_by_ticket[ticket_id] = msg.sender;
        index_by_ticket[ticket_id] = ticket_index;

        emit Mint(issuer_by_ticket[ticket_id], ticket_id, _to, _price, _currency);
        emit Transfer(msg.sender, _to, ticket_id);

        ++ticket_id;

        return ticket_id - 1;
    }

    function openSale(uint256 _ticket_id, uint256 _end) public eventOnly ticket(_ticket_id) ticket_exists(_ticket_id) issuer(_ticket_id) {
        require(isSaleOpen(_ticket_id) == false, "[T721] Sale already started");
        require(_end > block.timestamp, "[T721] Invalid end timestamp");

        sale_by_ticket[_ticket_id] = _end;

        emit Sale(issuer_by_ticket[_ticket_id], _ticket_id, owner_by_ticket[_ticket_id], _end);
    }

    function closeSale(uint256 _ticket_id) public eventOnly ticket(_ticket_id) ticket_exists(_ticket_id) issuer(_ticket_id) {
        require(isSaleOpen(_ticket_id) == true, "[T721] Ticket is not in sale");

        delete sale_by_ticket[_ticket_id];

        emit SaleClose(issuer_by_ticket[_ticket_id], _ticket_id, owner_by_ticket[_ticket_id]);
    }

    function isSaleOpen(uint256 _ticket_id) public view returns (bool) {
        return !(sale_by_ticket[_ticket_id] == 0 || block.timestamp > sale_by_ticket[_ticket_id]);
    }

    function buy(uint256 _ticket_id, address _buyer, uint256 _price, address _currency) public eventOnly ticket(_ticket_id) ticket_exists(_ticket_id) issuer(_ticket_id) zero(_buyer) {
        require(isSaleOpen(_ticket_id) == true, "[T721] Ticket is not in sale");
        require(_buyer != owner_by_ticket[_ticket_id], "[T721] You cannot buy your own ticket");

        emit Buy(issuer_by_ticket[_ticket_id], _ticket_id, _buyer, owner_by_ticket[_ticket_id], _price, _currency);

        approved_by_ticket[_ticket_id] = msg.sender;
        delete sale_by_ticket[_ticket_id];
        raw_transfer(owner_by_ticket[_ticket_id], _buyer, _ticket_id, false);

    }

    function getIssuer(uint256 _ticket_id) public view returns (address) {
        return issuer_by_ticket[_ticket_id];
    }

    function getSaleEnd(uint256 _ticket_id) public view returns (uint256) {
        return sale_by_ticket[_ticket_id];
    }

    //                                 /$$$$$$$$ /$$$$$$    /$$   /$$                           /$$
    //                                |_____ $$//$$__  $$ /$$$$  | $$                          |__/
    //    /$$$$$$   /$$$$$$   /$$$$$$$     /$$/|__/  \ $$|_  $$  | $$$$$$$   /$$$$$$   /$$$$$$$ /$$  /$$$$$$$
    //   /$$__  $$ /$$__  $$ /$$_____/    /$$/   /$$$$$$/  | $$  | $$__  $$ |____  $$ /$$_____/| $$ /$$_____/
    //  | $$$$$$$$| $$  \__/| $$         /$$/   /$$____/   | $$  | $$  \ $$  /$$$$$$$|  $$$$$$ | $$| $$
    //  | $$_____/| $$      | $$        /$$/   | $$        | $$  | $$  | $$ /$$__  $$ \____  $$| $$| $$
    //  |  $$$$$$$| $$      |  $$$$$$$ /$$/    | $$$$$$$$ /$$$$$$| $$$$$$$/|  $$$$$$$ /$$$$$$$/| $$|  $$$$$$$
    //   \_______/|__/       \_______/|__/     |________/|______/|_______/  \_______/|_______/ |__/ \_______/

    /// @notice Count all NFTs assigned to an owner
    /// @dev NFTs assigned to the zero address are considered invalid, and this
    ///  function throws for queries about the zero address.
    /// @param _owner An address for whom to query the balance
    /// @return The number of NFTs owned by `_owner`, possibly zero
    function balanceOf(address _owner) public view returns (uint256 balance) {
        uint256 count = 0;
        for (uint256 idx = 0; idx < tickets_by_owner[_owner].length; ++idx) {
            if (tickets_by_owner[_owner][idx] != 0) {
                ++count;
            }
        }
        return count;
    }

    /// @notice Find the owner of an NFT
    /// @dev NFTs assigned to zero address are considered invalid, and queries
    ///  about them do throw.
    /// @param _ticket_id The identifier for an NFT
    /// @return The address of the owner of the NFT
    function ownerOf(uint256 _ticket_id) public view
    ticket(_ticket_id)
    ticket_exists(_ticket_id)
    returns (address _owner)
    {
        return owner_by_ticket[_ticket_id];
    }

    /// @notice Query if token id exists
    /// @dev The zero id is invalid and result in throw.
    /// @param _ticket_id The NFT to check
    /// @return True if exists
    function exists(uint256 _ticket_id) public ticket(_ticket_id) view returns (bool _exists) {
        return owner_by_ticket[_ticket_id] != address(0);
    }

    /// @notice Set or reaffirm the approved address for an NFT
    /// @dev The zero address indicates there is no approved address.
    /// @dev Throws unless `msg.sender` is the current NFT owner, or an authorized
    ///  operator of the current owner.
    /// @param _approved The new approved NFT controller
    /// @param _ticket_id The NFT to approve
    function approve(address _approved, uint256 _ticket_id) public
    ticket(_ticket_id)
    ticket_exists(_ticket_id)
    owner(_ticket_id, msg.sender)
    {
        require(_approved != approved_by_ticket[_ticket_id]);

        if (_approved == address(0)) {
            delete approved_by_ticket[_ticket_id];
        } else {
            approved_by_ticket[_ticket_id] = _approved;
            emit Approval(msg.sender, _approved, _ticket_id);
        }
    }

    /// @notice Get the approved address for a single NFT
    /// @dev Throws if `_ticket_id` is not a valid NFT
    /// @param _ticket_id The NFT to find the approved address for
    /// @return The approved address for this NFT, or the zero address if there is none
    function getApproved(uint256 _ticket_id) public ticket(_ticket_id) view returns (address _operator) {
        return approved_by_ticket[_ticket_id];
    }

    /// @notice Enable or disable approval for a third party ("operator") to manage
    ///  all of `msg.sender`'s assets.
    /// @dev Emits the ApprovalForAll event. The contract MUST allow
    ///  multiple operators per owner.
    /// @param _operator Address to add to the set of authorized operators.
    /// @param _approved True if the operator is approved, false to revoke approval
    function setApprovalForAll(address _operator, bool _approved) public
    zero(_operator)
    {
        require(approvals_for_all_by_user[msg.sender][_operator] != _approved,
            "[T721] Action has no effect. Seting approval flag to old value.");
        if (!_approved) {
            delete approvals_for_all_by_user[msg.sender][_operator];
        } else {
            approvals_for_all_by_user[msg.sender][_operator] = true;
            emit ApprovalForAll(msg.sender, _operator, _approved);
        }
    }

    /// @notice Query if an address is an authorized operator for another address
    /// @param _owner The address that owns the NFTs
    /// @param _operator The address that acts on behalf of the owner
    /// @return True if `_operator` is an approved operator for `_owner`, false otherwise
    function isApprovedForAll(address _owner, address _operator) public view
    zero(_owner)
    zero(_operator)
    returns (bool)
    {
        return approvals_for_all_by_user[_owner][_operator];
    }

    /// @notice Transfer ownership of an NFT -- THE CALLER IS RESPONSIBLE
    ///  TO CONFIRM THAT `_to` IS CAPABLE OF RECEIVING NFTS OR ELSE
    ///  THEY MAY BE PERMANENTLY LOST
    /// @dev Throws unless `msg.sender` is the current owner, an authorized
    ///  operator, or the approved address for this NFT. Throws if `_from` is
    ///  not the current owner. Throws if `_to` is the zero address. Throws if
    ///  `_ticket_id` is not a valid NFT.
    /// @param _from The current owner of the NFT
    /// @param _to The new owner
    /// @param _ticket_id The NFT to transfer
    function transferFrom(address _from, address _to, uint256 _ticket_id) public
    {
        raw_transfer(_from, _to, _ticket_id, true);
    }

    /// @notice Transfers the ownership of an NFT from one address to another address
    /// @dev This works identically to the other function with an extra data parameter,
    ///  except this function just sets data to ""
    /// @param _from The current owner of the NFT
    /// @param _to The new owner
    /// @param _ticket_id The NFT to transfer
    function safeTransferFrom(address _from, address _to, uint256 _ticket_id) public {
        raw_transfer(_from, _to, _ticket_id, true);
        require(!(
        utility.isContract(_to) &&
        ERC721Receiver(_to).onERC721Received(_from, _ticket_id, "") != ERC721Receiver(0).onERC721Received.selector
        ));
    }

    /// @notice Transfers the ownership of an NFT from one address to another address
    /// @dev Throws unless `msg.sender` is the current owner, an authorized
    ///  operator, or the approved address for this NFT. Throws if `_from` is
    ///  not the current owner. Throws if `_to` is the zero address. Throws if
    ///  `_ticket_id` is not a valid NFT. When transfer is complete, this function
    ///  checks if `_to` is a smart contract (code size > 0). If so, it calls
    ///  `onERC721Received` on `_to` and throws if the return value is not
    ///  `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`.
    /// @param _from The current owner of the NFT
    /// @param _to The new owner
    /// @param _ticket_id The NFT to transfer
    /// @param _data Additional data with no specified format, sent in call to `_to`
    function safeTransferFrom(address _from, address _to, uint256 _ticket_id, bytes memory _data) public {
        raw_transfer(_from, _to, _ticket_id, true);
        require(!(
        utility.isContract(_to) &&
        ERC721Receiver(_to).onERC721Received(_from, _ticket_id, _data) != ERC721Receiver(0).onERC721Received.selector
        ));
    }

    //                                 /$$$$$$$$ /$$$$$$    /$$
    //                                |_____ $$//$$__  $$ /$$$$
    //    /$$$$$$   /$$$$$$   /$$$$$$$     /$$/|__/  \ $$|_  $$    /$$$$$$  /$$$$$$$  /$$   /$$ /$$$$$$/$$$$
    //   /$$__  $$ /$$__  $$ /$$_____/    /$$/   /$$$$$$/  | $$   /$$__  $$| $$__  $$| $$  | $$| $$_  $$_  $$
    //  | $$$$$$$$| $$  \__/| $$         /$$/   /$$____/   | $$  | $$$$$$$$| $$  \ $$| $$  | $$| $$ \ $$ \ $$
    //  | $$_____/| $$      | $$        /$$/   | $$        | $$  | $$_____/| $$  | $$| $$  | $$| $$ | $$ | $$
    //  |  $$$$$$$| $$      |  $$$$$$$ /$$/    | $$$$$$$$ /$$$$$$|  $$$$$$$| $$  | $$|  $$$$$$/| $$ | $$ | $$
    //   \_______/|__/       \_______/|__/     |________/|______/ \_______/|__/  |__/ \______/ |__/ |__/ |__/

    /// @notice Count NFTs tracked by this contract
    /// @return A count of valid NFTs tracked by this contract, where each one of
    ///  them has an assigned and queryable owner not equal to the zero address
    function totalSupply() public view returns (uint256) {
        return ticket_id - 1;
    }

    /// @notice Enumerate valid NFTs
    /// @dev Throws if `_index` >= `totalSupply()`.
    /// @param _index A counter less than `totalSupply()`
    /// @return The token identifier for the `_index`th NFT,
    ///  (sort order not specified)
    function tokenByIndex(uint256 _index) public view returns (uint256) {
        require(_index < totalSupply(), "[T721] Index out of range");

        return _index + 1;
    }

    /// @notice Enumerate NFTs assigned to an owner
    /// @dev Throws if `_index` >= `balanceOf(_owner)` or if
    ///  `_owner` is the zero address, representing invalid NFTs.
    /// @param _owner An address where we are interested in NFTs owned by them
    /// @param _index A counter less than `balanceOf(_owner)`
    /// @return The token identifier for the `_index`th NFT assigned to `_owner`,
    ///   (sort order not specified)
    function tokenOfOwnerByIndex(address _owner, uint256 _index) public view returns (uint256 _ticket_id) {
        require(_index < balanceOf(_owner), "[T721] Index out of range");

        uint256 real_idx = 0;
        for (uint256 idx = 0; idx < tickets_by_owner[_owner].length; ++idx) {
            if (tickets_by_owner[_owner][idx] != 0) {
                if (real_idx == _index) {
                    return tickets_by_owner[_owner][idx];
                } else {
                    ++real_idx;
                }
            }
        }

    }

    //                                 /$$$$$$$$ /$$$$$$    /$$                             /$$
    //                                |_____ $$//$$__  $$ /$$$$                            | $$
    //    /$$$$$$   /$$$$$$   /$$$$$$$     /$$/|__/  \ $$|_  $$   /$$$$$$/$$$$   /$$$$$$  /$$$$$$    /$$$$$$
    //   /$$__  $$ /$$__  $$ /$$_____/    /$$/   /$$$$$$/  | $$  | $$_  $$_  $$ /$$__  $$|_  $$_/   |____  $$
    //  | $$$$$$$$| $$  \__/| $$         /$$/   /$$____/   | $$  | $$ \ $$ \ $$| $$$$$$$$  | $$      /$$$$$$$
    //  | $$_____/| $$      | $$        /$$/   | $$        | $$  | $$ | $$ | $$| $$_____/  | $$ /$$ /$$__  $$
    //  |  $$$$$$$| $$      |  $$$$$$$ /$$/    | $$$$$$$$ /$$$$$$| $$ | $$ | $$|  $$$$$$$  |  $$$$/|  $$$$$$$
    //   \_______/|__/       \_______/|__/     |________/|______/|__/ |__/ |__/ \_______/   \___/   \_______/

    /// @notice A descriptive name for a collection of NFTs in this contract
    function name() external view returns (string memory _name) {
        return t721_name;
    }

    /// @notice An abbreviated name for NFTs in this contract
    function symbol() external view returns (string memory _symbol) {
        return t721_symbol;
    }

    /// @notice A distinct Uniform Resource Identifier (URI) for a given asset.
    /// @dev Throws if `_tokenId` is not a valid NFT. URIs are defined in RFC
    ///  3986. The URI may point to a JSON file that conforms to the "ERC721
    ///  Metadata JSON Schema".
    function tokenURI(uint256 _ticket_id) external view
    ticket(_ticket_id)
    ticket_exists(_ticket_id)
    returns (string memory)
    {
        if (whitelisted_events(issuer_by_ticket[_ticket_id]) == true) {
            return Minter(issuer_by_ticket[_ticket_id]).getEventURI(_ticket_id);

        }
        // TODO mint_with_uri
        return "";
    }

}
