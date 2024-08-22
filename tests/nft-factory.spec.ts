import { Blockchain, SandboxContract, TreasuryContract, printTransactionFees } from '@ton/sandbox';
import { Cell, toNano, beginCell } from '@ton/core';
import { NftFactory } from '../wrappers/NftFactory';
import { NftCollection } from '../wrappers/NftCollection';
import { UserStatus } from '../wrappers/Config';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';
describe('NFT Factory and Collection', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let nftFactory: SandboxContract<NftFactory>;
    let nftCollection: SandboxContract<NftCollection>;
    let nftFactoryCode: Cell;
    let nftCollectionCode: Cell;
    let nftItemCode: Cell;
    beforeAll(async () => {
        nftFactoryCode = await compile('NftFactory');
        console.log(nftFactoryCode);
        nftCollectionCode = await compile('NftCollection');
        console.log(nftCollectionCode);
        nftItemCode = await compile('NftItem');
        console.log(nftItemCode);
    });
    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        nftFactory = blockchain.openContract(NftFactory.createFromConfig({ index: 0, ownerAddress: deployer.address, nftCollectionCode: nftCollectionCode, }, nftFactoryCode));
        const deploynftFactoryResult = await nftFactory.sendDeploy(deployer.getSender(), toNano('0.05'));
        printTransactionFees(deploynftFactoryResult.transactions);
        expect(deploynftFactoryResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: nftFactory.address,
            success: true,
        });
        console.log("NFT Factory address: ", nftFactory.address);
        const deployCollectionResult = await nftFactory.sendDeployNFTCollection(
            deployer.getSender(), toNano('0.1'), 0, nftItemCode,
            "Hello World Collection", "New Collection", "https://raw.githubusercontent.com/Cosmodude/TAP/main/HackTonBerFest.png",
            5, 100, deployer.address, deployer.address);
        const collectionAddress = await nftFactory.getCollectionAddress(BigInt(0));
        expect(deployCollectionResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: nftFactory.address,
            success: true,
        });
        expect(deployCollectionResult.transactions).toHaveTransaction({
            from: nftFactory.address,
            to: await nftFactory.getCollectionAddress(BigInt(0)),
            success: true,
            deploy: true,
        });
        console.log("NFT Collection address: ", collectionAddress);

        const deployCollection2Result = await nftFactory.sendDeployNFTCollection(
            deployer.getSender(), toNano('0.1'), 1, nftItemCode,
            "Hello World Collection", "New Collection", "https://raw.githubusercontent.com/Cosmodude/TAP/main/HackTonBerFest.png",
            5, 100, deployer.address, deployer.address);
        const collection2Address = await nftFactory.getCollectionAddress(BigInt(1));
        expect(deployCollection2Result.transactions).toHaveTransaction({
            from: deployer.address,
            to: nftFactory.address,
            success: true,
        });
        expect(deployCollection2Result.transactions).toHaveTransaction({
            from: nftFactory.address,
            to: collection2Address,
            success: true,
            deploy: true,
        });
        console.log("Second NFT Collection address: ", collection2Address);

        nftCollection = blockchain.openContract(NftCollection.createFromAddress(collectionAddress));
    });
    it('Empty test', async () => {});
    it('should allow whitelisted user to mint multiple times', async () => {
        const whitelistedUser = await blockchain.treasury('whitelisted');
        // Add user to whitelist
        const sendAddToWhitelistResult = await nftCollection.sendAddToWhitelist(deployer.getSender(), toNano('0.05'), whitelistedUser.address);
        expect(sendAddToWhitelistResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: nftCollection.address,
            success: true,
        });
        expect(await nftCollection.getUserStatus(whitelistedUser.address)).toStrictEqual(UserStatus.IsWhitelisted);
        // Mint first NFT
        const mintResult1 = await nftCollection.sendMintNft(whitelistedUser.getSender(), toNano('0.1'), 0, toNano('0.1'), 0, whitelistedUser.address,
        "Hello World", "New Item", "https://raw.githubusercontent.com/Cosmodude/TAP/main/HackTonBerFest.png");
        expect(mintResult1.transactions).toHaveTransaction({ from: whitelistedUser.address, to: nftCollection.address, success: true, });
        const Nft1Address = await nftCollection.getNftAddressByIndex(BigInt(0));
        console.log("NFT #0 address: ", Nft1Address);
        expect(mintResult1.transactions).toHaveTransaction({ from: nftCollection.address, to: Nft1Address, success: true, deploy: true, });
        // Mint second NFT
        const mintResult2 = await nftCollection.sendMintNft(whitelistedUser.getSender(), toNano('0.1'), 1, toNano('0.1'), 0, whitelistedUser.address,
        "Hello World", "New Item", "https://raw.githubusercontent.com/Cosmodude/TAP/main/HackTonBerFest.png");
        expect(mintResult2.transactions).toHaveTransaction({ from: whitelistedUser.address, to: nftCollection.address, success: true, });
        const Nft2Address = await nftCollection.getNftAddressByIndex(BigInt(1));
        console.log("NFT #1 address: ", Nft2Address);
        expect(mintResult2.transactions).toHaveTransaction({ from: nftCollection.address, to: Nft2Address, success: true, deploy: true, });
        // Check collection data
        const collectionData = await nftCollection.getCollectionData();
        expect(collectionData.nextItemIndex).toEqual(2);
    });
    it('should prevent blacklisted user from minting', async () => {
        const blacklistedUser = await blockchain.treasury('blacklisted');
        // Add user to blacklist
        await nftCollection.sendAddToBlacklist(deployer.getSender(), toNano('0.05'), blacklistedUser.address);
        expect(await nftCollection.getUserStatus(blacklistedUser.address)).toStrictEqual(UserStatus.IsBlacklisted);
        // Attempt to mint
        const mintResult = await nftCollection.sendMintNft(blacklistedUser.getSender(), toNano('0.1'), 0, toNano('0.1'), 0, blacklistedUser.address,
        "Hello World", "New Item", "https://raw.githubusercontent.com/Cosmodude/TAP/main/HackTonBerFest.png");
        expect(mintResult.transactions).toHaveTransaction({
            from: blacklistedUser.address,
            to: nftCollection.address,
            success: false,
            exitCode: 403, // Assuming 403 is the error code for blacklisted users
        });
        // Check collection data
        const collectionData = await nftCollection.getCollectionData();
        expect(collectionData.nextItemIndex).toEqual(0);
    });

    it('should allow normal user to mint only once', async () => {
        const normalUser = await blockchain.treasury('normal');
        // First mint should succeed
        const mintResult1 = await nftCollection.sendMintNft(normalUser.getSender(), toNano('0.1'), 0, toNano('0.1'), 0, normalUser.address,
        "Hello World", "New Item", "https://raw.githubusercontent.com/Cosmodude/TAP/main/HackTonBerFest.png");
        expect(mintResult1.transactions).toHaveTransaction({ from: normalUser.address, to: nftCollection.address, success: true, });
        const Nft1Address = await nftCollection.getNftAddressByIndex(BigInt(0));
        console.log("NFT #0 address: ", Nft1Address);
        expect(mintResult1.transactions).toHaveTransaction({ from: nftCollection.address, to: Nft1Address, success: true, deploy: true, });
        // Second mint should fail
        const mintResult2 = await nftCollection.sendMintNft(normalUser.getSender(), toNano('0.1'), 0, toNano('0.1'), 0, normalUser.address,
        "Hello World", "New Item", "https://raw.githubusercontent.com/Cosmodude/TAP/main/HackTonBerFest.png");
        expect(mintResult2.transactions).toHaveTransaction({ from: normalUser.address, to: nftCollection.address, success: false, exitCode: 404});
        // Check collection data
        const collectionData = await nftCollection.getCollectionData();
        expect(collectionData.nextItemIndex).toEqual(1);
    });

    it('should allow admin to add and remove from whitelist and blacklist', async () => {
        const user = await blockchain.treasury('user');
        // Add to whitelist
        await nftCollection.sendAddToWhitelist(deployer.getSender(), toNano('0.05'), user.address);
        expect(await nftCollection.getUserStatus(user.address)).toStrictEqual(UserStatus.IsWhitelisted);
        // Remove from whitelist
        await nftCollection.sendRemoveFromWhitelist(deployer.getSender(), toNano('0.05'), user.address);
        expect(await nftCollection.getUserStatus(user.address)).toStrictEqual(UserStatus.NotFound);
        // Add to blacklist
        await nftCollection.sendAddToBlacklist(deployer.getSender(), toNano('0.05'), user.address);
        expect(await nftCollection.getUserStatus(user.address)).toStrictEqual(UserStatus.IsBlacklisted);
        // Remove from blacklist
        await nftCollection.sendRemoveFromBlacklist(deployer.getSender(), toNano('0.05'), user.address);
        expect(await nftCollection.getUserStatus(user.address)).toStrictEqual(UserStatus.NotFound);
    });
});