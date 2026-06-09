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

    /// keccak256(recorder, runId, seq) => anchor
    mapping(bytes32 => Anchor) private anchors;

    event StepAnchored(address indexed recorder, bytes32 indexed runId, uint256 indexed seq, bytes32 packetHash);

    error AlreadyAnchored();
    error NotFound();

    function key(address recorder, bytes32 runId, uint256 seq) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(recorder, runId, seq));
    }

    /// @notice Anchor one step's content hash. Write-once per (sender, runId, seq).
    function anchor(bytes32 runId, uint256 seq, bytes32 packetHash) external {
        bytes32 k = key(msg.sender, runId, seq);
        if (anchors[k].atBlock != 0) revert AlreadyAnchored();
        anchors[k] = Anchor({ contentHash: packetHash, atBlock: uint64(block.number), recorder: msg.sender });
        emit StepAnchored(msg.sender, runId, seq, packetHash);
    }

    /// @notice Read an anchored hash back. Reverts if absent.
    function getAnchor(bytes32 runId, uint256 seq) external view returns (bytes32 contentHash, uint64 atBlock) {
        return getAnchorFor(msg.sender, runId, seq);
    }

    /// @notice Read an anchor for a known recorder address, used by SDK verifiers.
    function getAnchorFor(address recorder, bytes32 runId, uint256 seq)
        public
        view
        returns (bytes32 contentHash, uint64 atBlock)
    {
        Anchor memory a = anchors[key(recorder, runId, seq)];
        if (a.atBlock == 0) revert NotFound();
        return (a.contentHash, a.atBlock);
    }
}
