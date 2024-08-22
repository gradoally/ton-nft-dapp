import { Address, toNano } from '@ton/core';
import { NftCollection } from '../wrappers/NftCollection';
import { NetworkProvider } from '@ton/blueprint';

const randomSeed= Math.floor(Math.random() * 10000);

export async function run(provider: NetworkProvider, args: string[]) {
    const collectionAddress = "kQATD6eTUQVPc7SH6DEffS_iB36gQ6rdI_cQdHfsPSz1LE_B";
    const newItemIndex = 0;
    const address = Address.parse(collectionAddress);
    const nftCollection = provider.open(NftCollection.createFromAddress(address));
    const mint = await nftCollection.sendMintNft(provider.sender(), toNano("0.1"), randomSeed, toNano("0.05"), newItemIndex, provider.sender().address!!,
        "OnChain", "Holds onchain metadata", "https://raw.githubusercontent.com/gradoally/nft-factory/main/Gradoally.png",);

}
    