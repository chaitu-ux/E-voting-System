// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Voting {

    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    mapping(uint => Candidate) public candidates;
    uint public candidatesCount;

    // Hash-based student identity
    mapping(bytes32 => bool) public hasVoted;

    address public admin;

    event VoteCast(bytes32 indexed studentHash, uint candidateId);

    constructor() {
        admin = msg.sender;
        addCandidate("Candidate 1");
        addCandidate("Candidate 2");
    }

    function addCandidate(string memory _name) private {
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
    }

    function vote(bytes32 _studentHash, uint _candidateId) public {

        require(_studentHash != bytes32(0), "Invalid student identity");
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate");
        require(!hasVoted[_studentHash], "Student already voted");

        hasVoted[_studentHash] = true;
        candidates[_candidateId].voteCount++;

        emit VoteCast(_studentHash, _candidateId);
    }

    /* =========================================
       🔥 WINNER FUNCTION ADDED 
    ========================================= */

    function getWinner() public view returns (string memory winnerName, uint winnerVotes) {

        require(candidatesCount > 0, "No candidates");

        uint maxVotes = 0;
        uint winnerId = 1;

        for (uint i = 1; i <= candidatesCount; i++) {
            if (candidates[i].voteCount > maxVotes) {
                maxVotes = candidates[i].voteCount;
                winnerId = i;
            }
        }

        return (candidates[winnerId].name, candidates[winnerId].voteCount);
    }
}