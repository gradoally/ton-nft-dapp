import { toNano } from '@ton/core';
import { NftFactory } from '../wrappers/NftFactory';
import { compile, NetworkProvider } from '@ton/blueprint';


export async function run(provider: NetworkProvider) {
    const nftFactoryCode = await compile('NftFactory');
    const nftCollectionCode = await compile('NftCollection');
    const nftFactory = provider.open(NftFactory.createFromConfig({ index: 12, ownerAddress: provider.sender().address!, nftCollectionCode: nftCollectionCode, }, nftFactoryCode));
    await nftFactory.sendDeploy(provider.sender(), toNano('0.1'));
    await provider.waitForDeploy(nftFactory.address);
    console.log(`NFT Factory deployed at https://testnet.tonviewer.com/${nftFactory.address}`);
}