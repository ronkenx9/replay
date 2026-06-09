// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title FlightRecorder — on-chain anchor for AI agent decision records
/// @notice REPLAY anchors the SHA-256 of each agent step here. The blob lives
///         off-chain; this contract is the tamper-evidence root. Anyone can
///         anchor; records are scoped to the sender, so one agent cannot
///         overwrite another's history. Anchors are write-once.
contract FlightRecorder {
    struct Anchor {
        bytes32 contentHash;
        uint64 atBlock;
        address recorder;
    }

    /// keccak256(recorder, runId, stepIndex) => anchor
    mapping(bytes32 => Anchor) private anchors;

    event StepAnchored(
        address indexed recorder,
        bytes32 indexed runId,
        uint256 stepIndex,
        bytes32 contentHash,
        string agentId
    );

    error AlreadyAnchored();
    error NotFound();

    function key(address recorder, bytes32 runId, uint256 stepIndex) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(recorder, runId, stepIndex));
    }

    /// @notice Anchor one step's content hash. Write-once per (sender, runId, stepIndex).
    function anchorStep(bytes32 runId, uint256 stepIndex, bytes32 contentHash, string calldata agentId) external {
        bytes32 k = key(msg.sender, runId, stepIndex);
        if (anchors[k].atBlock != 0) revert AlreadyAnchored();
        anchors[k] = Anchor({ contentHash: contentHash, atBlock: uint64(block.number), recorder: msg.sender });
        emit StepAnchored(msg.sender, runId, stepIndex, contentHash, agentId);
    }

    /// @notice Read an anchored hash back. Reverts if absent.
    function getAnchor(address recorder, bytes32 runId, uint256 stepIndex)
        external
        view
        returns (bytes32 contentHash, uint64 atBlock)
    {
        Anchor memory a = anchors[key(recorder, runId, stepIndex)];
        if (a.atBlock == 0) revert NotFound();
        return (a.contentHash, a.atBlock);
    }
}
