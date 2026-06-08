// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {KovaCampaign} from "./KovaCampaign.sol";

/// @notice Factory that deploys KovaCampaign instances and indexes them.
contract KovaFactory {
    address public owner;
    address public feeRecipient;

    address[] public allCampaigns;
    mapping(address => address[]) public campaignsByOwner;

    event CampaignCreated(
        address indexed campaign,
        address indexed owner,
        string title,
        uint256 goal,
        uint256 deadline,
        bool privateMode
    );

    error NotOwner();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(address _feeRecipient) {
        owner        = msg.sender;
        feeRecipient = _feeRecipient;
    }

    function createCampaign(
        string calldata title,
        string calldata description,
        string calldata imageUrl,
        string calldata category,
        uint256 goal,
        uint256 deadline,
        bool privateMode
    ) external returns (address campaign) {
        campaign = address(new KovaCampaign(
            msg.sender,
            feeRecipient,
            title,
            description,
            imageUrl,
            category,
            goal,
            deadline,
            privateMode
        ));

        allCampaigns.push(campaign);
        campaignsByOwner[msg.sender].push(campaign);

        emit CampaignCreated(campaign, msg.sender, title, goal, deadline, privateMode);
    }

    function getCampaignCount() external view returns (uint256) {
        return allCampaigns.length;
    }

    function getCampaigns(uint256 offset, uint256 limit)
        external
        view
        returns (address[] memory)
    {
        uint256 total = allCampaigns.length;
        if (offset >= total) return new address[](0);
        uint256 end = offset + limit > total ? total : offset + limit;
        address[] memory result = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = allCampaigns[i];
        }
        return result;
    }

    function getMyCampaigns(address user) external view returns (address[] memory) {
        return campaignsByOwner[user];
    }

    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        feeRecipient = _feeRecipient;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }
}
