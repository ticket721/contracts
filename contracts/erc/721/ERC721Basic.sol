pragma solidity 0.5.0;

/**
 * @title ERC721 Non-Fungible Token Standard basic interface
 * @dev see https://github.com/ethereum/EIPs/blob/master/EIPS/eip-721.md
 */
contract ERC721Basic {
  event Transfer(address indexed _from, address indexed _to, uint256 _ticket_id);
  event Approval(address indexed _owner, address indexed _approved, uint256 _ticket_id);
  event ApprovalForAll(address indexed _owner, address indexed _operator, bool _approved);

  function balanceOf(address _owner) public view returns (uint256 _balance);
  function ownerOf(uint256 _ticket_id) public view returns (address _owner);
  function exists(uint256 _ticket_id) public view returns (bool _exists);
  
  function approve(address _to, uint256 _ticket_id) public;
  function getApproved(uint256 _ticket_id) public view returns (address _operator);
  
  function setApprovalForAll(address _operator, bool _approved) public;
  function isApprovedForAll(address _owner, address _operator) public view returns (bool);

  function transferFrom(address _from, address _to, uint256 _ticket_id) public;
  function safeTransferFrom(address _from, address _to, uint256 _ticket_id) public;
  function safeTransferFrom(address _from, address _to, uint256 _ticket_id, bytes memory _data) public;
}
