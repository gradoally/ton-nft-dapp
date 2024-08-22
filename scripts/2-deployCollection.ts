import { toNano, Address } from '@ton/core';
import { NftFactory } from '../wrappers/NftFactory';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const newCollectionIndex = 1;
    const nftItemCode = await compile('NftItem');
    const nftFactory = provider.open(NftFactory.createFromAddress(Address.parse("kQCFsXVKaZ-DGK7lKHJK6FoRQUeJNue2Az22NQuz4chlakWI")));
    await nftFactory.sendDeployNFTCollection(
        provider.sender(), toNano('0.1'), newCollectionIndex, nftItemCode,
        "Hello World Collection", "New Collection", "https://raw.githubusercontent.com/gradoally/nft-factory/main/Gradoally.png",
        5, 100, provider.sender().address!, provider.sender().address!);
    const collectionAddress = await nftFactory.getCollectionAddress(BigInt(newCollectionIndex));
    console.log(`NFT Collection deployed at https://testnet.tonviewer.com/${collectionAddress}`);
}