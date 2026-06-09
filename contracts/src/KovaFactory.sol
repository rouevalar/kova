// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {KovaCampaign} from "./KovaCampaign.sol";
import {IERC20} from "./interfaces/IERC20.sol";

/// @notice Factory that deploys KovaCampaign instances and indexes them.
/// Holds a USDC yield reserve that is automatically seeded into each new
/// campaign so that simulated yield is backed by real USDC at finalization.
contract KovaFactory {
    address public constant USDC = 0x3600000000000000000000000000000000000000;

    address public owner;
    address public feeRecipient;

    // Amount of USDC (6 decimals) to seed into each newly created campaign.
    // Configurable by owner. Default: 1 USDC.
    uint256 public yieldSeedPerCampaign = 1_000_000;

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
    event ReserveDeposited(address indexed from, uint256 amount);
    event CampaignSeeded(address indexed campaign, uint256 amount);

    error NotOwner();
    error TransferFailed();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(address _feeRecipient) {
        owner        = msg.sender;
        feeRecipient = _feeRecipient;
    }

    // ─── Yield reserve ───────────────────────────────────────────────────────

    /// @notice Deposit USDC into the factory as a yield reserve.
    /// Caller must have approved this contract for `amount` USDC first.
    function depositReserve(uint256 amount) external {
        bool ok = IERC20(USDC).transferFrom(msg.sender, address(this), amount);
        if (!ok) revert TransferFailed();
        emit ReserveDeposited(msg.sender, amount);
    }

    /// @notice Current USDC yield reserve held by the factory.
    function reserveBalance() external view returns (uint256) {
        return IERC20(USDC).balanceOf(address(this));
    }

    /// @notice Owner can adjust the per-campaign seed amount.
    function setYieldSeedPerCampaign(uint256 amount) external onlyOwner {
        yieldSeedPerCampaign = amount;
    }

    // ─── Campaign creation ───────────────────────────────────────────────────

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

        // Seed from yield reserve if available
        uint256 seed = yieldSeedPerCampaign;
        uint256 reserve = IERC20(USDC).balanceOf(address(this));
        if (seed > 0 && reserve >= seed) {
            IERC20(USDC).transfer(campaign, seed);
            emit CampaignSeeded(campaign, seed);
        }

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
