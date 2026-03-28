// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ShieldFi {
    struct Policy {
        address holder;
        address tokenAddress;
        uint256 insuredAmount;
        uint256 premium;
        uint256 startTime;
        uint256 expiryTime;
        bool active;
        bool claimed;
    }

    struct TokenRisk {
        address tokenAddress;
        uint256 initialLiquidity;
        uint256 lastCheckedLiquidity;
        uint256 lastCheckedTime;
        uint256 lastDropBps; // Track last drop percentage
        bool rugDetected;
    }

    mapping(uint256 => Policy) public policies;
    mapping(address => uint256[]) public userPolicies;
    mapping(address => TokenRisk) public tokenRisks;
    mapping(address => uint256) public tokenTVL;

    uint256 public policyCount;
    uint256 public totalPremiumPool;
    uint256 public protocolFees;
    address public owner;
    uint256 public payoutThreshold = 2000; // 20% for demo (configurable)

    uint256 public constant PREMIUM_RATE = 1000; // 10% in basis points
    uint256 public constant PROTOCOL_FEE_RATE = 50; // 0.5%
    uint256 public constant COVERAGE_PERIOD = 48 hours;

    event TokenRegistered(
        address indexed tokenAddress,
        uint256 initialLiquidity
    );
    event CoveragePurchased(
        uint256 indexed policyId,
        address indexed holder,
        address indexed tokenAddress,
        uint256 insuredAmount,
        uint256 premium
    );
    event LiquidityUpdated(
        address indexed tokenAddress,
        uint256 newLiquidity,
        uint256 dropPercent
    );
    event RugDetected(
        address indexed tokenAddress,
        uint256 finalLiquidity,
        uint256 dropPercent
    );
    event RugSimulated(address indexed tokenAddress);
    event PayoutClaimed(
        uint256 indexed policyId,
        address indexed holder,
        uint256 amount
    );
    event PayoutThresholdUpdated(uint256 newThreshold);

    constructor() {
        owner = msg.sender;
        policyCount = 0;
        totalPremiumPool = 0;
        protocolFees = 0;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    function setPayoutThreshold(uint256 bps) external onlyOwner {
        require(bps > 0 && bps <= 10000, "Invalid threshold");
        payoutThreshold = bps;
        emit PayoutThresholdUpdated(bps);
    }

    function registerToken(
        address tokenAddress,
        uint256 initialLiquidity
    ) external {
        require(
            tokenRisks[tokenAddress].tokenAddress == address(0),
            "Token already registered"
        );
        require(tokenAddress != address(0), "Invalid token address");
        require(
            initialLiquidity > 0,
            "Initial liquidity must be greater than 0"
        );

        tokenRisks[tokenAddress] = TokenRisk({
            tokenAddress: tokenAddress,
            initialLiquidity: initialLiquidity,
            lastCheckedLiquidity: initialLiquidity,
            lastCheckedTime: block.timestamp,
            lastDropBps: 0,
            rugDetected: false
        });

        emit TokenRegistered(tokenAddress, initialLiquidity);
    }

    function buyCoverage(
        address tokenAddress,
        uint256 insuredAmount
    ) external payable {
        require(
            tokenRisks[tokenAddress].tokenAddress != address(0),
            "Token not registered"
        );
        require(insuredAmount > 0, "Insured amount must be greater than 0");

        uint256 premium = (insuredAmount * PREMIUM_RATE) / 10000;
        require(msg.value >= premium, "Insufficient MON sent for premium");

        uint256 protocolFee = (premium * PROTOCOL_FEE_RATE) / 10000;
        uint256 premiumForPool = premium - protocolFee;

        protocolFees += protocolFee;
        totalPremiumPool += premiumForPool;

        uint256 policyId = policyCount;
        policies[policyId] = Policy({
            holder: msg.sender,
            tokenAddress: tokenAddress,
            insuredAmount: insuredAmount,
            premium: premium,
            startTime: block.timestamp,
            expiryTime: block.timestamp + COVERAGE_PERIOD,
            active: true,
            claimed: false
        });

        userPolicies[msg.sender].push(policyId);
        tokenTVL[tokenAddress] += insuredAmount;
        policyCount++;

        uint256 refund = msg.value - premium;
        if (refund > 0) {
            (bool ok, ) = payable(msg.sender).call{value: refund}("");
            require(ok, "Refund failed");
        }

        emit CoveragePurchased(
            policyId,
            msg.sender,
            tokenAddress,
            insuredAmount,
            premium
        );
    }

    function updateLiquidity(
        address tokenAddress,
        uint256 newLiquidity
    ) external {
        require(
            tokenRisks[tokenAddress].tokenAddress != address(0),
            "Token not registered"
        );

        TokenRisk storage risk = tokenRisks[tokenAddress];
        risk.lastCheckedLiquidity = newLiquidity;
        risk.lastCheckedTime = block.timestamp;

        uint256 dropBps = 0;
        if (newLiquidity < risk.initialLiquidity) {
            dropBps =
                ((risk.initialLiquidity - newLiquidity) * 10000) /
                risk.initialLiquidity;
            risk.lastDropBps = dropBps;

            if (dropBps >= payoutThreshold) {
                risk.rugDetected = true;
                emit RugDetected(tokenAddress, newLiquidity, dropBps);
            }
        } else {
            risk.lastDropBps = 0;
        }

        emit LiquidityUpdated(tokenAddress, newLiquidity, dropBps);
    }

    function claimPayout(uint256 policyId) external {
        require(policyId < policyCount, "Policy does not exist");

        Policy storage policy = policies[policyId];
        require(policy.holder == msg.sender, "Only policy holder can claim");
        require(
            policy.active && !policy.claimed,
            "Policy not active or already claimed"
        );
        require(
            tokenRisks[policy.tokenAddress].rugDetected,
            "Rug not detected for this token"
        );
        require(block.timestamp <= policy.expiryTime, "Policy expired");

        uint256 dropBps = tokenRisks[policy.tokenAddress].lastDropBps;
        require(dropBps >= payoutThreshold, "Drop below threshold");

        // Proportional payout: insured * (10000 - dropBps) / 10000
        // E.g., insured 2 MON, 20% drop → 2 * 8000 / 10000 = 1.6 MON
        uint256 payout = (policy.insuredAmount * (10000 - dropBps)) / 10000;

        require(
            totalPremiumPool >= payout,
            "Insufficient premium pool for payout"
        );

        policy.claimed = true;
        policy.active = false;
        totalPremiumPool -= payout;

        (bool ok, ) = payable(msg.sender).call{value: payout}("");
        require(ok, "Payout transfer failed");

        emit PayoutClaimed(policyId, msg.sender, payout);
    }

    function simulateRugPull(address tokenAddress) external {
        require(
            tokenRisks[tokenAddress].tokenAddress != address(0),
            "Token not registered"
        );

        TokenRisk storage risk = tokenRisks[tokenAddress];
        uint256 simulatedLiquidity = (risk.initialLiquidity * 5) / 100; // 5% of initial
        risk.lastCheckedLiquidity = simulatedLiquidity;
        risk.lastCheckedTime = block.timestamp;

        uint256 dropBps = 9500; // 95% drop
        risk.lastDropBps = dropBps;
        risk.rugDetected = true;

        emit LiquidityUpdated(tokenAddress, simulatedLiquidity, dropBps);
        emit RugSimulated(tokenAddress);
    }

    function getUserPolicies(
        address user
    ) external view returns (uint256[] memory) {
        return userPolicies[user];
    }

    function getPolicy(uint256 policyId) external view returns (Policy memory) {
        require(policyId < policyCount, "Policy does not exist");
        return policies[policyId];
    }

    function getTokenRisk(
        address tokenAddress
    ) external view returns (TokenRisk memory) {
        return tokenRisks[tokenAddress];
    }

    function getPremiumForAmount(
        uint256 insuredAmount
    ) external pure returns (uint256) {
        return (insuredAmount * PREMIUM_RATE) / 10000;
    }

    function withdrawProtocolFees() external onlyOwner {
        uint256 amount = protocolFees;
        require(amount > 0, "No fees to withdraw");

        protocolFees = 0;
        (bool ok, ) = payable(owner).call{value: amount}("");
        require(ok, "Fee withdrawal failed");
    }

    receive() external payable {}
}
