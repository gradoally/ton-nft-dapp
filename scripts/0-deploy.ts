import { toNano } from '@ton/core';
import { NftFactory } from '../wrappers/NftFactory';
import { NftCollection } from '../wrappers/NftCollection';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const nftFactoryCode = await compile('NftFactory');
    const nftCollectionCode = await compile('NftCollection');
    const nftItemCode = await compile('NftItem');
    const nftFactory = provider.open(NftFactory.createFromConfig({ index: 0, ownerAddress: provider.sender().address!, nftCollectionCode: nftCollectionCode, }, nftFactoryCode));
    await nftFactory.sendDeploy(provider.sender(), toNano('0.1'));
    await provider.waitForDeploy(nftFactory.address);
    console.log(`NFT Factory deployed at https://testnet.tonviewer.com/${nftFactory.address}`);
    await nftFactory.sendDeployNFTCollection(
        provider.sender(), toNano('0.1'), 0, nftItemCode,
        "Hello World Collection", "New Collection", "https://raw.githubusercontent.com/gradoally/nft-factory/main/Gradoally.png",
        5, 100, provider.sender().address!, provider.sender().address!);
    const collectionAddress = await nftFactory.getCollectionAddress(BigInt(0));
    await provider.waitForDeploy(collectionAddress);
    console.log(`NFT Collection deployed at https://testnet.tonviewer.com/${collectionAddress}`);
    const nftCollection = provider.open(NftCollection.createFromAddress(collectionAddress));
    await nftCollection.sendMintNft(provider.sender(), toNano("0.1"), 0, toNano("0.05"), 0, provider.sender().address!!,
        "OnChain", "Holds onchain metadata", "https://raw.githubusercontent.com/gradoally/nft-factory/main/Gradoally.png",);
    const NftAddress = await nftCollection.getNftAddressByIndex(BigInt(0));
    await provider.waitForDeploy(NftAddress);
    console.log(`NFT Item deployed at https://testnet.tonviewer.com/${NftAddress}`);
}