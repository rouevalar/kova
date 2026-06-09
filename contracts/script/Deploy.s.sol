// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {KovaFactory} from "../src/KovaFactory.sol";

contract Deploy is Script {
    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PK");
        address deployer = vm.addr(pk);
        console.log("Deployer:", deployer);

        vm.startBroadcast(pk);
        KovaFactory factory = new KovaFactory(deployer);
        vm.stopBroadcast();

        console.log("KovaFactory deployed at:", address(factory));
        console.log("Fee recipient:", factory.feeRecipient());
        console.log("Yield seed per campaign:", factory.yieldSeedPerCampaign());
    }
}
