// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "./interfaces/IERC20.sol";

/// @notice Individual fundraising campaign. One deployed per campaign.
/// Yield is simulated at 5% APY accrued per second. USDC is 6 decimals.
contract KovaCampaign {
    // ─── Arc USDC (ERC-20 interface, 6 decimals) ────────────────────────────
    address public constant USDC = 0x3600000000000000000000000000000000000000;

    // ─── Immutable campaign config ───────────────────────────────────────────
    address public immutable factory;
    address public owner;
    string  public title;
    string  public description;
    string  public imageUrl;
    string  public category;
    uint256 public goal;         // in USDC (6 decimals)
    uint256 public deadline;
    bool    public privateMode;  // anonymous contribution mode

    // ─── State ───────────────────────────────────────────────────────────────
    uint256 public totalRaised;
    uint256 public createdAt;
    bool    public finalized;
    bool    public goalReached;

    // simulated yield: 5% APY = ~0.000000158548959918820% per second
    // stored as per-USDC-second in 1e18 precision
    uint256 public constant YIELD_RATE_PER_SECOND_1E18 = 1585489599188; // 5% APY scaled

    uint256 public constant FEE_BPS = 100; // 1% of yield
    address public feeRecipient;

    // contributions: donor => amount in USDC
    mapping(address => uint256) public contributions;
    mapping(address => uint256) public contributedAt; // for yield split
    address[] internal _donors;
    mapping(address => bool) internal _isDonor;

    // for privacy mode: hide individual amounts but track total
    mapping(address => bool) public isPrivateDonor;

    event Contributed(address indexed donor, uint256 amount, bool isAnonymous);
    event Finalized(bool goalReached, uint256 totalRaised, uint256 yieldEarned, uint256 fee);
    event Refunded(address indexed donor, uint256 principal, uint256 yieldShare);

    error NotOwner();
    error AlreadyFinalized();
    error DeadlineNotReached();
    error DeadlineReached();
    error TransferFailed();
    error ZeroAmount();
    error GoalAlreadyReached();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(
        address _owner,
        address _feeRecipient,
        string memory _title,
        string memory _description,
        string memory _imageUrl,
        string memory _category,
        uint256 _goal,
        uint256 _deadline,
        bool _privateMode
    ) {
        factory      = msg.sender;
        owner        = _owner;
        feeRecipient = _feeRecipient;
        title        = _title;
        description  = _description;
        imageUrl     = _imageUrl;
        category     = _category;
        goal         = _goal;
        deadline     = _deadline;
        privateMode  = _privateMode;
        createdAt    = block.timestamp;
    }

    // ─── Contribute ──────────────────────────────────────────────────────────

    function contribute(uint256 amount, bool isAnonymous) external {
        if (finalized) revert AlreadyFinalized();
        if (block.timestamp >= deadline) revert DeadlineReached();
        if (amount == 0) revert ZeroAmount();

        bool ok = IERC20(USDC).transferFrom(msg.sender, address(this), amount);
        if (!ok) revert TransferFailed();

        if (!_isDonor[msg.sender]) {
            _donors.push(msg.sender);
            _isDonor[msg.sender] = true;
            contributedAt[msg.sender] = block.timestamp;
        }

        contributions[msg.sender] += amount;
        totalRaised += amount;

        if (privateMode && isAnonymous) {
            isPrivateDonor[msg.sender] = true;
        }

        emit Contributed(msg.sender, amount, privateMode && isAnonymous);
    }

    // ─── View helpers ────────────────────────────────────────────────────────

    function yieldEarned() public view returns (uint256) {
        if (totalRaised == 0) return 0;
        uint256 elapsed = block.timestamp - createdAt;
        // yield = principal * rate * time / 1e18
        return (totalRaised * YIELD_RATE_PER_SECOND_1E18 * elapsed) / 1e18;
    }

    function donorYieldShare(address donor) public view returns (uint256) {
        if (totalRaised == 0) return 0;
        uint256 elapsed = block.timestamp - contributedAt[donor];
        uint256 share = (contributions[donor] * YIELD_RATE_PER_SECOND_1E18 * elapsed) / 1e18;
        return share;
    }

    function totalWithYield() public view returns (uint256) {
        return totalRaised + yieldEarned();
    }

    function donorCount() external view returns (uint256) {
        return _donors.length;
    }

    function getDonors() external view returns (address[] memory donors, uint256[] memory amounts) {
        donors  = new address[](_donors.length);
        amounts = new uint256[](_donors.length);
        for (uint256 i = 0; i < _donors.length; i++) {
            address d = _donors[i];
            donors[i]  = isPrivateDonor[d] ? address(0) : d;
            amounts[i] = contributions[d];
        }
    }

    // ─── Finalize (owner withdraws after deadline or goal reached) ───────────

    function finalize() external onlyOwner {
        if (finalized) revert AlreadyFinalized();
        if (block.timestamp < deadline && totalRaised < goal) revert DeadlineNotReached();

        finalized = true;
        goalReached = totalRaised >= goal;

        if (goalReached) {
            _withdrawToOwner();
        } else {
            _refundAll();
        }
    }

    function _withdrawToOwner() internal {
        uint256 yield    = yieldEarned();
        uint256 fee      = (yield * FEE_BPS) / 10000;
        uint256 ownerAmt = totalRaised + yield - fee;

        uint256 balance = IERC20(USDC).balanceOf(address(this));
        if (ownerAmt > balance) ownerAmt = balance;

        uint256 feeAmt = balance - ownerAmt;

        if (ownerAmt > 0) {
            bool ok = IERC20(USDC).transfer(owner, ownerAmt);
            if (!ok) revert TransferFailed();
        }
        if (feeAmt > 0) {
            bool ok2 = IERC20(USDC).transfer(feeRecipient, feeAmt);
            if (!ok2) revert TransferFailed();
        }

        emit Finalized(true, totalRaised, yield, feeAmt);
    }

    function _refundAll() internal {
        uint256 yield = yieldEarned();
        uint256 fee   = (yield * FEE_BPS) / 10000;
        uint256 yieldAfterFee = yield - fee;

        if (fee > 0) {
            uint256 feeBalance = fee;
            uint256 avail = IERC20(USDC).balanceOf(address(this));
            if (feeBalance > avail) feeBalance = avail;
            if (feeBalance > 0) {
                IERC20(USDC).transfer(feeRecipient, feeBalance);
            }
        }

        for (uint256 i = 0; i < _donors.length; i++) {
            address d = _donors[i];
            uint256 principal = contributions[d];
            if (principal == 0) continue;

            uint256 yieldShare = totalRaised > 0
                ? (yieldAfterFee * principal) / totalRaised
                : 0;

            uint256 refundAmt = principal + yieldShare;
            uint256 bal = IERC20(USDC).balanceOf(address(this));
            if (refundAmt > bal) refundAmt = bal;

            if (refundAmt > 0) {
                bool ok = IERC20(USDC).transfer(d, refundAmt);
                if (!ok) revert TransferFailed();
            }

            emit Refunded(d, principal, yieldShare);
        }

        emit Finalized(false, totalRaised, yield, fee);
    }

    // ─── Emergency: owner can update description/image (not goal/deadline) ───

    function updateMeta(string calldata _description, string calldata _imageUrl) external onlyOwner {
        description = _description;
        imageUrl = _imageUrl;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }
}
