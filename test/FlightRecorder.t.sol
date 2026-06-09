// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FlightRecorder} from "../contracts/FlightRecorder.sol";

interface Vm {
    function prank(address sender) external;
}

contract FlightRecorderTest {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    FlightRecorder private recorder;
    bytes32 private constant RUN_ID = keccak256("run-1");
    bytes32 private constant PACKET_HASH = bytes32(uint256(0x1234));

    function setUp() public {
        recorder = new FlightRecorder();
    }

    function testAnchorWritesAndReadsPacketHash() public {
        recorder.anchor(RUN_ID, 1, PACKET_HASH);

        (bytes32 contentHash, uint64 atBlock) = recorder.getAnchor(RUN_ID, 1);

        require(contentHash == PACKET_HASH, "content hash mismatch");
        require(atBlock > 0, "missing block");
    }

    function testDuplicateAnchorReverts() public {
        recorder.anchor(RUN_ID, 1, PACKET_HASH);

        try this.anchorAgain(RUN_ID, 1, PACKET_HASH) {
            revert("duplicate anchor did not revert");
        } catch {}
    }

    function testDifferentSenderCanUseSameRunAndSequence() public {
        recorder.anchor(RUN_ID, 1, PACKET_HASH);

        address other = address(0xBEEF);
        bytes32 otherHash = bytes32(uint256(0x5678));
        vm.prank(other);
        recorder.anchor(RUN_ID, 1, otherHash);

        (bytes32 originalHash,) = recorder.getAnchor(RUN_ID, 1);
        (bytes32 otherRecordedHash,) = recorder.getAnchorFor(other, RUN_ID, 1);

        require(originalHash == PACKET_HASH, "original sender hash changed");
        require(otherRecordedHash == otherHash, "other sender hash mismatch");
    }

    function anchorAgain(bytes32 runId, uint256 seq, bytes32 packetHash) external {
        recorder.anchor(runId, seq, packetHash);
    }
}
