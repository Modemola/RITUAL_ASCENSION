// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract ProgressManager is AccessControl {
    bytes32 public constant BACKEND_OPERATOR = keccak256("BACKEND_OPERATOR");

    mapping(address => uint256) public totalXP;
    mapping(bytes32 => bool) public usedSourceRefs;

    event XPAwarded(address indexed wallet, uint256 amount, string reason, bytes32 sourceRef);

    constructor(address backendOperator) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(BACKEND_OPERATOR, backendOperator);
    }

    function awardXP(
        address wallet,
        uint256 amount,
        string calldata reason,
        bytes32 sourceRef
    ) external onlyRole(BACKEND_OPERATOR) {
        require(wallet != address(0), "Invalid wallet");
        require(!usedSourceRefs[sourceRef], "XP already awarded for this source");

        usedSourceRefs[sourceRef] = true;
        totalXP[wallet] += amount;

        emit XPAwarded(wallet, amount, reason, sourceRef);
    }

    function getXP(address wallet) external view returns (uint256) {
        return totalXP[wallet];
    }
}
